import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { BucketsAPI } from "@influxdata/influxdb-client-apis";
import { RedstoneCommon } from "@redstone-finance/utils";

export const RETRY_CONFIG: Omit<RedstoneCommon.RetryConfig, "fn"> = {
  maxRetries: 5,
  waitBetweenMs: 100,
  backOff: {
    backOffBase: 2,
  },
};

export interface InfluxAuthParams {
  url: string;
  token: string;
  bucketName: string;
  orgName: string;
}

export class InfluxService {
  private readonly influx;

  public constructor(private authParams: InfluxAuthParams) {
    this.influx = new InfluxDB({
      token: this.authParams.token,
      url: this.authParams.url,
      timeout: 30000,
    });
  }

  public async query(queryParams: string, beforeQueryStatements = "") {
    const query = `${beforeQueryStatements}\n
      from(bucket: "${this.authParams.bucketName}") ${queryParams}`;

    return await RedstoneCommon.retry({
      fn: async () => await this.getQueryApi().collectRows(query),
      ...RETRY_CONFIG,
    })();
  }

  async filterByRetentionPeriod<T extends { timestampMilliseconds: number }>(
    data: T[]
  ) {
    const retentionPeriod = (await this.getBucketRetentionPeriod()) * 1000;

    console.log(`Filtering data by retention period: ${retentionPeriod} [ms]`);

    if (retentionPeriod === 0) {
      return data;
    }

    const now = Date.now();
    const newData = data.filter(
      (entry) => now - entry.timestampMilliseconds < retentionPeriod
    );

    console.log(`Filtered-out item count: ${data.length - newData.length}`);

    return newData;
  }

  async insert(requestData: Point[]) {
    const writeApi = this.getWriteApi();
    requestData.forEach((data) => writeApi.writePoint(data));

    await writeApi.close();
  }

  async getBucketRetentionPeriod(): Promise<number> {
    const selectedBucket = await this.getBucket();
    const retentionRule = selectedBucket.retentionRules[0];

    if (retentionRule.type !== "expire") {
      return 0;
    }

    return retentionRule.everySeconds;
  }

  private getQueryApi() {
    return this.influx.getQueryApi(this.authParams.orgName);
  }

  private getWriteApi() {
    return this.influx.getWriteApi(
      this.authParams.orgName,
      this.authParams.bucketName,
      "ms"
    );
  }

  private async getBucket() {
    const bucketsApi = new BucketsAPI(this.influx);
    const buckets = await bucketsApi.getBuckets({
      org: this.authParams.orgName,
    });

    const selectedBucket = buckets.buckets?.find(
      (b) => b.name === this.authParams.bucketName
    );

    if (!selectedBucket) {
      throw new Error(`Bucket "${this.authParams.bucketName}" not found`);
    }
    return selectedBucket;
  }
}

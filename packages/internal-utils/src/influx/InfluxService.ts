import { InfluxDB } from "@influxdata/influxdb-client";
import { RedstoneCommon } from "@redstone-finance/utils";

export const RETRY_CONFIG = {
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
  private influx;

  public constructor(private authParams: InfluxAuthParams) {
    this.influx = new InfluxDB({
      token: this.authParams.token,
      url: this.authParams.url,
    });
  }

  public getWriteApi() {
    return this.influx.getWriteApi(
      this.authParams.orgName,
      this.authParams.bucketName,
      "ms"
    );
  }

  public async query(queryParams: string, beforeQueryStatements = "") {
    const query = `${beforeQueryStatements}\n
      from(bucket: "${this.authParams.bucketName}") ${queryParams}`;

    return await RedstoneCommon.retry({
      fn: async () => await this.getQueryApi().collectRows(query),
      ...RETRY_CONFIG,
    })();
  }

  private getQueryApi() {
    return this.influx.getQueryApi(this.authParams.orgName);
  }
}

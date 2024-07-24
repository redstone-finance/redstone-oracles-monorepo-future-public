import { InfluxDB } from "@influxdata/influxdb-client";

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

  public async query(queryParams: string, beforeQuery = "") {
    const query = `${beforeQuery}\n
      from(bucket: "${this.authParams.bucketName}") ${queryParams}`;

    return await this.getQueryApi().collectRows(query);
  }

  private getQueryApi() {
    return this.influx.getQueryApi(this.authParams.orgName);
  }
}

import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { getSSMParameterValue } from "./params";

export const INFLUXDB_ORG = "redstone";
export const INFLUXDB_BUCKET = "redstone";

export interface InfluxConfig {
  url: string;
  token: string;
}

export async function fetchInfluxConfig(): Promise<InfluxConfig> {
  const influxDbUrlPromise = getSSMParameterValue(
    process.env.INFLUXDB_URL_SSM_PATH ?? "/dev/influxdb/url"
  );
  const influxDbTokenPromise = getSSMParameterValue(
    process.env.INFLUXDB_TOKEN_SSM_PATH ?? "/dev/influxdb/token"
  );

  return {
    url: (await influxDbUrlPromise)!,
    token: (await influxDbTokenPromise)!,
  };
}

export async function insertIntoInfluxDb(
  influx: InfluxDB,
  requestData: Point[]
) {
  const writeApi = influx.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET, "ms");
  requestData.forEach((data) => writeApi.writePoint(data));
  await writeApi.close();
}

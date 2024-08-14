import { MathUtils, RedstoneCommon } from "@redstone-finance/utils";
import { InfluxService } from "../influx/InfluxService";
import { INFLUXDB_ORG } from "../influx/influxdb-config";

const TXS_MEASUREMENT = "redstoneTransactions";

export class RedStoneTxStatsInfluxService extends InfluxService {
  static withEnvParams(
    influxUrl: string | undefined = RedstoneCommon.getFromEnv("INFLUX_URL"),
    influxToken: string | undefined = RedstoneCommon.getFromEnv("INFLUX_TOKEN"),
    bucketName = "redstone-transactions"
  ) {
    if (!influxUrl || !influxToken) {
      throw new Error("Influx url or token not passed!");
    }

    return new RedStoneTxStatsInfluxService({
      url: influxUrl,
      token: influxToken,
      bucketName,
      orgName: INFLUXDB_ORG,
    });
  }

  async getTransactionStats(
    chainId: number,
    walletAddress: string,
    contractAddress: string,
    daysRange = 30,
    limit = 10
  ) {
    const query = `
      |> range(start: -${daysRange}d)
      |> filter(fn: (r) => r["_measurement"] == "${TXS_MEASUREMENT}")
      |> filter(fn: (r) => r["_field"] == "gasUsed" or r["_field"] == "gasPrice") 
      |> filter(fn: (r) => r["chainId"] == "${chainId}" and r["isFailed"] != "true")
      |> filter(fn: (r) => strings.toLower(v: r["sender"]) == "${walletAddress.toLowerCase()}")
      |> filter(fn: (r) => strings.toLower(v: r["contract"]) == "${contractAddress.toLowerCase()}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> map(fn: (r) => ({ r with gasCost: float(v: r.gasUsed) * float(v: r.gasPrice) }))
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit})
      |> yield(name: "result")
      `;
    const responseRows = (await this.query(query, `import "strings"`)) as {
      gasCost: number;
      _time: string;
    }[];

    if (!responseRows.length) {
      return { mean: 0, stdDev: 0, median: 0, count: 0 };
    }

    const times = responseRows.map((row) => Date.parse(row._time));
    const avgInterval =
      responseRows.length === 1
        ? undefined
        : (times[0] - times[times.length - 1]) /
          (1000 * (responseRows.length - 1));

    const gasCosts = responseRows.map((row) => row.gasCost);
    const count = gasCosts.length;
    const mean = gasCosts.reduce((acc, val) => acc + val, 0) / count;
    const median = MathUtils.getMedian(gasCosts);
    const stdDev = Math.sqrt(
      gasCosts
        .map((x) => Math.pow(x - mean, 2))
        .reduce((acc, val) => acc + val, 0) / count
    );

    return { mean, stdDev, count, median, avgInterval };
  }
}

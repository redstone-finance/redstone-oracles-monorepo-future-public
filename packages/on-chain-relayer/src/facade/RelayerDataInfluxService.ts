import { Point } from "@influxdata/influxdb-client";
import { InfluxService } from "@redstone-finance/internal-utils";
import {
  chooseDataPackagesTimestamp,
  ContractParamsProvider,
  DataPackagesResponse,
} from "@redstone-finance/sdk";
import { RedstoneCommon, SafeNumber } from "@redstone-finance/utils";
import { basename } from "path";
import { z } from "zod";
import { config } from "../config";
import { RelayerConfig } from "../types";

const TXS_MEASUREMENT = "redstoneTransactions";
const SENDER_TAG =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

export class RelayerDataInfluxService extends InfluxService {
  async updatePriceValues(
    paramsProvider: ContractParamsProvider
  ): Promise<void> {
    const relayerConfig = config();
    const dataPackages = await paramsProvider.requestDataPackages();
    const manifestFile = RedstoneCommon.getFromEnv("MANIFEST_FILE", z.string());

    await this.insert([
      RelayerDataInfluxService.getInfluxPointForDataFeedPackages(dataPackages, {
        ...relayerConfig,
        manifestFile,
      }),
    ]);
  }

  private static getInfluxPointForDataFeedPackages(
    dataPackagesResponse: DataPackagesResponse,
    relayerConfig: RelayerConfig & { manifestFile: string }
  ) {
    const timestamp = chooseDataPackagesTimestamp(dataPackagesResponse);

    const point = new Point(TXS_MEASUREMENT);

    // Setting tags
    point.tag("functionSignature", "");
    point.tag("functionType", "relayer-dry-run");
    point.tag("chainId", String(relayerConfig.chainId));
    point.tag("adapterName", basename(relayerConfig.manifestFile, ".json"));
    point.tag("chainName", String(relayerConfig.chainName));
    point.tag("dataServiceId", relayerConfig.dataServiceId);
    point.tag("contract", String(relayerConfig.adapterContractAddress));
    point.tag("sender", SENDER_TAG);
    point.tag("isFailed", String(false));
    point.tag("parsingFailed", String(false));

    // Setting fields
    const dataPackages = Object.values(dataPackagesResponse)
      .flatMap((x) => x)
      .filter((x) => x != undefined);

    point.intField("dataTimestampMs", timestamp);
    point.intField("dataPackagesCount", dataPackages.length);
    point.timestamp(new Date());

    for (const [dataFeedId, packages] of Object.entries(dataPackagesResponse)) {
      if (!packages) {
        continue;
      }

      const value = SafeNumber.getMedian(
        packages.map((dataPackage) =>
          SafeNumber.createSafeNumber(
            dataPackage.dataPackage.dataPoints[0].toObj().value
          )
        )
      );

      point.floatField(`value-${dataFeedId}`, value);
    }

    return point;
  }
}

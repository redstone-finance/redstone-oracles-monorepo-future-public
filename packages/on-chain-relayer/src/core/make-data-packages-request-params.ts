import {
  DataServiceIds,
  getSignersForDataServiceId,
} from "@redstone-finance/oracles-smartweave-contracts";
import { DataPackagesRequestParams } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import { RelayerConfig } from "../config/RelayerConfig";

export function canIgnoreMissingFeeds(relayerConfig: RelayerConfig) {
  return relayerConfig.adapterContractType === "multi-feed";
}

export function makeDataPackagesRequestParams(
  relayerConfig: RelayerConfig,
  uniqueSignersThreshold: number,
  dataFeedIds?: string[]
) {
  const {
    dataServiceId,
    dataFeeds,
    dataPackagesNames,
    cacheServiceUrls,
    waitForAllGatewaysTimeMs,
    enableEnhancedRequestDataPackagesLogs,
  } = relayerConfig;

  return {
    dataServiceId,
    uniqueSignersCount: uniqueSignersThreshold,
    dataPackagesIds: dataFeedIds ?? dataPackagesNames ?? dataFeeds,
    urls: cacheServiceUrls,
    maxTimestampDeviationMS: RedstoneCommon.minToMs(3),
    authorizedSigners: getSignersForDataServiceId(
      dataServiceId as DataServiceIds
    ),
    ignoreMissingFeed: canIgnoreMissingFeeds(relayerConfig),
    waitForAllGatewaysTimeMs,
    enableEnhancedLogs: enableEnhancedRequestDataPackagesLogs,
  } as DataPackagesRequestParams;
}

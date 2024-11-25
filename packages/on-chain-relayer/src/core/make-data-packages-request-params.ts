import {
  DataServiceIds,
  getSignersForDataServiceId,
} from "@redstone-finance/oracles-smartweave-contracts";
import {
  calculateHistoricalPackagesTimestamp,
  DataPackagesRequestParams,
} from "@redstone-finance/sdk";
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

export function convertToHistoricalDataPackagesRequestParams(
  requestParams: DataPackagesRequestParams,
  relayerConfig: RelayerConfig
) {
  const { fallbackOffsetInMilliseconds, historicalPackagesGateways } =
    relayerConfig;

  if (
    !fallbackOffsetInMilliseconds ||
    !historicalPackagesGateways ||
    !Array.isArray(historicalPackagesGateways) ||
    !historicalPackagesGateways.length
  ) {
    throw new Error(
      `Historical packages fetcher for fallback deviation check is not properly configured: ` +
        `offset=${fallbackOffsetInMilliseconds} milliseconds., gateways=${JSON.stringify(
          historicalPackagesGateways
        )}, isArray=${Array.isArray(historicalPackagesGateways)} `
    );
  }

  return {
    ...requestParams,
    historicalTimestamp: calculateHistoricalPackagesTimestamp(
      fallbackOffsetInMilliseconds
    ),
    urls: historicalPackagesGateways,
  };
}

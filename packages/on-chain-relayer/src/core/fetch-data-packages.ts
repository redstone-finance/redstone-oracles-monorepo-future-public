import {
  DataServiceIds,
  getSignersForDataServiceId,
} from "@redstone-finance/oracles-smartweave-contracts";
import {
  DataPackagesRequestParams,
  DataPackagesResponse,
  calculateHistoricalPackagesTimestamp,
  requestDataPackages,
} from "@redstone-finance/sdk";
import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { config } from "../config";
import { RelayerConfig } from "../types";

const logger = loggerFactory("fetch-data-packages");

export async function fetchDataPackages(
  config: RelayerConfig,
  uniqueSignersThreshold: number,
  isHistorical: boolean = false,
  dataFeedIds?: string[]
) {
  const { dataServiceId, dataFeeds, dataPackagesNames, cacheServiceUrls } =
    config;

  const requestParams: DataPackagesRequestParams = {
    dataServiceId,
    uniqueSignersCount: uniqueSignersThreshold,
    dataPackagesIds: dataFeedIds ?? dataPackagesNames ?? dataFeeds,
    urls: cacheServiceUrls,
    maxTimestampDeviationMS: RedstoneCommon.minToMs(3),
    authorizedSigners: getSignersForDataServiceId(
      dataServiceId as DataServiceIds
    ),
    ignoreMissingFeed: true,
  };

  try {
    return isHistorical
      ? await requestHistoricalDataPackages(requestParams)
      : await requestDataPackages(requestParams);
  } catch (e) {
    logger.error((e as Error).message); // Do not remove - to have the full message visible as the Gelato web3FunctionLogs log entry.
    throw e;
  }
}

const requestHistoricalDataPackages = (
  requestParams: DataPackagesRequestParams
): Promise<DataPackagesResponse> => {
  const { fallbackOffsetInMinutes, historicalPackagesGateways } = config();

  if (
    !!fallbackOffsetInMinutes &&
    !!historicalPackagesGateways &&
    Array.isArray(historicalPackagesGateways) &&
    historicalPackagesGateways.length
  ) {
    return requestDataPackages({
      ...requestParams,
      historicalTimestamp: calculateHistoricalPackagesTimestamp(
        fallbackOffsetInMinutes
      ),
      urls: historicalPackagesGateways,
    });
  }

  throw new Error(
    `Historical packages fetcher for fallback deviation check is not properly configured: ` +
      `offset=${fallbackOffsetInMinutes} min., gateways=${JSON.stringify(
        historicalPackagesGateways
      )}, isArray=${Array.isArray(historicalPackagesGateways)} `
  );
};

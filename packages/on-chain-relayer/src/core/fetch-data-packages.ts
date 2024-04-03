import {
  calculateHistoricalPackagesTimestamp,
  DataPackagesRequestParams,
  DataPackagesResponse,
  requestDataPackages,
} from "@redstone-finance/sdk";
import { config } from "../config";
import { RelayerConfig } from "../types";

export async function fetchDataPackages(
  config: RelayerConfig,
  uniqueSignersThreshold: number,
  isHistorical: boolean = false
) {
  const { dataServiceId, dataFeeds, cacheServiceUrls } = config;

  const requestParams: DataPackagesRequestParams = {
    dataServiceId,
    uniqueSignersCount: uniqueSignersThreshold,
    dataFeeds,
    urls: cacheServiceUrls,
  };

  try {
    return isHistorical
      ? await requestHistoricalDataPackages(requestParams)
      : await requestDataPackages(requestParams);
  } catch (e) {
    console.error((e as Error).message); // Do not remove - to have the full message visible as the Gelato web3FunctionLogs log entry.

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

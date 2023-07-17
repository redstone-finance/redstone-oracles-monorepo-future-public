import {
  DataPackagesRequestParams,
  DataPackagesResponse,
  requestDataPackages,
  ValuesForDataFeeds,
} from "redstone-sdk";
import { RelayerConfig } from "../types";
import { config } from "../config";

const MILLISECONDS_IN_ONE_MINUTE = 60 * 1000;

export async function fetchDataPackages(
  config: RelayerConfig,
  uniqueSignersThreshold: number,
  valuesFromContract: ValuesForDataFeeds,
  isHistorical: boolean = false
) {
  const { dataServiceId, dataFeeds } = config;

  const requestParams = {
    dataServiceId,
    uniqueSignersCount: uniqueSignersThreshold,
    dataFeeds,
    valuesToCompare: valuesFromContract,
  };

  return isHistorical
    ? await requestHistoricalDataPackages(requestParams)
    : await requestDataPackages(requestParams);
}

const requestHistoricalDataPackages = (
  requestParams: DataPackagesRequestParams
): Promise<DataPackagesResponse> => {
  const { fallbackOffsetInMinutes, historicalPackagesGateway } = config();

  if (!!fallbackOffsetInMinutes && !!historicalPackagesGateway) {
    return requestDataPackages({
      ...requestParams,
      historicalTimestamp: calculateOlderPackagesTimestamp(
        fallbackOffsetInMinutes
      ),
      urls: [historicalPackagesGateway],
    });
  }

  throw (
    `Historical packages fetcher for fallback deviation check is not properly configured: ` +
    `offset=${fallbackOffsetInMinutes} min., gateway=${historicalPackagesGateway}`
  );
};

const calculateOlderPackagesTimestamp = (
  deviationCheckOffsetInMinutes: number
) => {
  if (deviationCheckOffsetInMinutes > 0) {
    // We round the timestamp to full minutes for being compatible with
    // oracle-nodes, which usually work with rounded 10s and 60s intervals
    return (
      Math.round(
        Date.now() / MILLISECONDS_IN_ONE_MINUTE - deviationCheckOffsetInMinutes
      ) * MILLISECONDS_IN_ONE_MINUTE
    );
  }
};

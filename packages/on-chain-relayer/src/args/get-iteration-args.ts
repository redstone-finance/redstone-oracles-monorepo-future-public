import { getLastRoundParamsFromContract } from "../core/contract-interactions/get-last-round-params";
import {
  DataPackagesRequestParams,
  DataPackagesResponse,
  requestDataPackages,
  ValuesForDataFeeds,
} from "redstone-sdk";
import { getValuesForDataFeeds } from "../core/contract-interactions/get-values-for-data-feeds";
import { shouldUpdate } from "../core/update-conditions/should-update";
import {
  getUpdatePricesArgs,
  UpdatePricesArgs,
} from "./get-update-prices-args";
import { IRedstoneAdapter } from "../../typechain-types";
import { config } from "../config";
import { olderPackagesTimestamp } from "../core/older-packages-timestamp";

export const getIterationArgs = async (
  adapterContract: IRedstoneAdapter
): Promise<{
  shouldUpdatePrices: boolean;
  args?: UpdatePricesArgs;
  message?: string;
}> => {
  const { dataServiceId, uniqueSignersCount, dataFeeds, updateConditions } =
    config();

  const { lastUpdateTimestamp } = await getLastRoundParamsFromContract(
    adapterContract
  );

  // We fetch latest values from contract only if we want to check value deviation
  let valuesFromContract: ValuesForDataFeeds = {};
  if (
    updateConditions.includes("value-deviation") ||
    updateConditions.includes("fallback-deviation")
  ) {
    valuesFromContract = await getValuesForDataFeeds(
      adapterContract,
      dataFeeds
    );
  }

  const requestParams = {
    dataServiceId,
    uniqueSignersCount,
    dataFeeds,
    valuesToCompare: valuesFromContract,
  };

  const promises = [requestDataPackages(requestParams)];
  if (updateConditions.includes("fallback-deviation")) {
    promises.push(requestHistoricalDataPackages(requestParams));
  }

  const values = await Promise.all(promises);
  const dataPackages = values[0];
  const olderDataPackages = values[1];

  const { shouldUpdatePrices, warningMessage } = shouldUpdate(
    {
      dataPackages,
      olderDataPackages,
      valuesFromContract,
      lastUpdateTimestamp,
    },
    config()
  );

  if (!shouldUpdatePrices) {
    return { shouldUpdatePrices, message: warningMessage };
  } else {
    const updatePricesArgs = await getUpdatePricesArgs(
      dataPackages,
      adapterContract,
      lastUpdateTimestamp
    );

    return {
      shouldUpdatePrices,
      ...updatePricesArgs,
      message: `${warningMessage}; ${updatePricesArgs.message || ""}`,
    };
  }
};

export const requestHistoricalDataPackages = (
  requestParams: DataPackagesRequestParams
): Promise<DataPackagesResponse> => {
  const {
    fallbackDeviationCheckOffsetInMinutes,
    historicalPackagesGateway,
    historicalPackagesDataServiceId,
  } = config();

  if (
    !!fallbackDeviationCheckOffsetInMinutes &&
    !!historicalPackagesGateway &&
    !!historicalPackagesDataServiceId
  ) {
    return requestDataPackages({
      ...requestParams,
      dataServiceId: historicalPackagesDataServiceId,
      historicalTimestamp: olderPackagesTimestamp(
        fallbackDeviationCheckOffsetInMinutes
      ),
      urls: [historicalPackagesGateway],
    });
  }

  throw (
    `Historical packages fetcher for fallback deviation check is not properly configured: ` +
    `offset=${fallbackDeviationCheckOffsetInMinutes} min., gateway=${historicalPackagesGateway}, dataServiceId=${historicalPackagesDataServiceId}`
  );
};

import { RelayerConfig } from "../../types";
import {
  DataPackagesResponse,
  ValuesForDataFeeds,
} from "@redstone-finance/sdk";
import { checkValueDeviationCondition } from "./check-value-deviation-condition";
import { fetchDataPackages } from "../fetch-data-packages";

export const performValueDeviationConditionChecks = async (
  latestDataPackages: DataPackagesResponse,
  valuesFromContract: ValuesForDataFeeds,
  config: RelayerConfig,
  historicalDataPackagesFetchCallback: () => Promise<DataPackagesResponse>
) => {
  const { shouldUpdatePrices, warningMessage } = checkValueDeviationCondition(
    latestDataPackages,
    valuesFromContract,
    config
  );

  const isFallback = (config.fallbackOffsetInMinutes ?? 0) > 0;
  let historicalShouldUpdatePrices = true;
  let historicalWarningMessage = "";

  if ((shouldUpdatePrices || config.isNotLazy) && isFallback) {
    const historicalDataPackages = await historicalDataPackagesFetchCallback();

    const {
      shouldUpdatePrices: historicalShouldUpdatePricesTmp,
      warningMessage: historicalWarningMessageTmp,
    } = checkValueDeviationCondition(
      historicalDataPackages,
      valuesFromContract,
      config
    );

    historicalShouldUpdatePrices = historicalShouldUpdatePricesTmp;
    historicalWarningMessage = ` AND Historical ${historicalWarningMessageTmp}`;
  }

  return {
    shouldUpdatePrices: shouldUpdatePrices && historicalShouldUpdatePrices,
    warningMessage: `${
      isFallback ? "Deviation in fallback mode: " : ""
    }${warningMessage}${historicalWarningMessage}`,
  };
};

export const valueDeviationCondition = async (
  latestDataPackages: DataPackagesResponse,
  uniqueSignersThreshold: number,
  valuesFromContract: ValuesForDataFeeds,
  config: RelayerConfig
) => {
  const olderDataPackagesFetchCallback = async () => {
    return await fetchDataPackages(
      config,
      uniqueSignersThreshold,
      valuesFromContract,
      true
    );
  };

  return await performValueDeviationConditionChecks(
    latestDataPackages,
    valuesFromContract,
    config,
    olderDataPackagesFetchCallback
  );
};

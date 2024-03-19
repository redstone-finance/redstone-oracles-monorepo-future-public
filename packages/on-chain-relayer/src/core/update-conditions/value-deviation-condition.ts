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
  lastUpdateTimestampInMs: number,
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

  const skipFallbackUpdate =
    isFallback &&
    config.fallbackSkipDeviationBasedFrequentUpdates &&
    Date.now() - lastUpdateTimestampInMs <
      (config.fallbackOffsetInMinutes ?? 0) * 60 * 1000;

  const shouldUpdatePricesNoSkip =
    shouldUpdatePrices && historicalShouldUpdatePrices;
  const skipFallbackMessage =
    shouldUpdatePricesNoSkip && skipFallbackUpdate
      ? `Update skipped: less than ${config.fallbackOffsetInMinutes} minutes passed since last update. `
      : "";
  const prefix = isFallback ? "Deviation in fallback mode: " : "";

  return {
    shouldUpdatePrices: shouldUpdatePricesNoSkip && !skipFallbackUpdate,
    warningMessage: `${prefix}${skipFallbackMessage}${warningMessage}${historicalWarningMessage}`,
  };
};

export const valueDeviationCondition = async (
  latestDataPackages: DataPackagesResponse,
  uniqueSignersThreshold: number,
  valuesFromContract: ValuesForDataFeeds,
  lastUpdateTimestampInMs: number,
  config: RelayerConfig
) => {
  const olderDataPackagesFetchCallback = async () => {
    return await fetchDataPackages(config, uniqueSignersThreshold, true);
  };

  return await performValueDeviationConditionChecks(
    latestDataPackages,
    valuesFromContract,
    lastUpdateTimestampInMs,
    config,
    olderDataPackagesFetchCallback
  );
};

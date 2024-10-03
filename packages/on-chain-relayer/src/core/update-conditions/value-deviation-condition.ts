import { DataPackagesResponse } from "@redstone-finance/sdk";
import { BigNumber } from "ethers";
import { RelayerConfig } from "../../types";
import { fetchDataPackages } from "../fetch-data-packages";
import { checkValueDeviationCondition } from "./check-value-deviation-condition";

export const performValueDeviationConditionChecks = async (
  dataFeedId: string,
  latestDataPackages: DataPackagesResponse,
  valuesFromContract: BigNumber,
  lastUpdateTimestampInMs: number,
  config: RelayerConfig,
  historicalDataPackagesFetchCallback: () => Promise<DataPackagesResponse>
) => {
  const { shouldUpdatePrices, maxDeviationRatio, warningMessage } =
    checkValueDeviationCondition(
      dataFeedId,
      latestDataPackages,
      valuesFromContract,
      config
    );

  const isFallback = config.fallbackOffsetInMinutes > 0;
  let historicalShouldUpdatePrices = true;
  let historicalWarningMessage = "";
  let historicalMaxDeviation = 0;

  if ((shouldUpdatePrices || config.isNotLazy) && isFallback) {
    const historicalDataPackages = await historicalDataPackagesFetchCallback();

    const {
      shouldUpdatePrices: historicalShouldUpdatePricesTmp,
      maxDeviationRatio: historicalMaxDeviationTmp,
      warningMessage: historicalWarningMessageTmp,
    } = checkValueDeviationCondition(
      dataFeedId,
      historicalDataPackages,
      valuesFromContract,
      config
    );

    historicalShouldUpdatePrices = historicalShouldUpdatePricesTmp;
    historicalMaxDeviation = historicalMaxDeviationTmp;
    historicalWarningMessage = ` AND Historical ${historicalWarningMessageTmp}`;
  }

  const skipFallbackUpdate =
    isFallback &&
    config.fallbackSkipDeviationBasedFrequentUpdates &&
    Date.now() - lastUpdateTimestampInMs <
      config.fallbackOffsetInMinutes * 60 * 1000;

  const shouldUpdatePricesNoSkip =
    shouldUpdatePrices && historicalShouldUpdatePrices;
  const skipFallbackMessage =
    shouldUpdatePricesNoSkip && skipFallbackUpdate
      ? `Update skipped: less than ${config.fallbackOffsetInMinutes} minutes passed since last update. `
      : "";
  const prefix = isFallback ? "Deviation in fallback mode: " : "";

  return {
    shouldUpdatePrices: shouldUpdatePricesNoSkip && !skipFallbackUpdate,
    maxDeviationRatio: Math.max(maxDeviationRatio, historicalMaxDeviation),
    warningMessage: `${prefix}${skipFallbackMessage}${warningMessage}${historicalWarningMessage}`,
  };
};

export const valueDeviationCondition = async (
  dataFeedId: string,
  latestDataPackages: DataPackagesResponse,
  uniqueSignersThreshold: number,
  valueFromContract: BigNumber,
  lastUpdateTimestampInMs: number,
  config: RelayerConfig
) => {
  const olderDataPackagesFetchCallback = async () => {
    return await fetchDataPackages(config, uniqueSignersThreshold, true);
  };

  return await performValueDeviationConditionChecks(
    dataFeedId,
    latestDataPackages,
    valueFromContract,
    lastUpdateTimestampInMs,
    config,
    olderDataPackagesFetchCallback
  );
};

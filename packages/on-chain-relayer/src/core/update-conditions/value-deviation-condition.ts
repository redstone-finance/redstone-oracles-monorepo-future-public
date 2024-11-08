import {
  ContractParamsProvider,
  DataPackagesResponse,
} from "@redstone-finance/sdk";
import { BigNumber } from "ethers";
import { RelayerConfig } from "../../types";
import {
  convertToHistoricalDataPackagesRequestParams,
  makeDataPackagesRequestParams,
} from "../make-data-packages-request-params";
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

  const isFallback = config.fallbackOffsetInMilliseconds > 0;
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
    Date.now() - lastUpdateTimestampInMs < config.fallbackOffsetInMilliseconds;

  const shouldUpdatePricesNoSkip =
    shouldUpdatePrices && historicalShouldUpdatePrices;
  const skipFallbackMessage =
    shouldUpdatePricesNoSkip && skipFallbackUpdate
      ? `Update skipped: less than ${config.fallbackOffsetInMilliseconds} milliseconds passed since last update. `
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
    const dataPackagesRequestParams =
      convertToHistoricalDataPackagesRequestParams(
        makeDataPackagesRequestParams(config, uniqueSignersThreshold),
        config
      );

    return await new ContractParamsProvider(
      dataPackagesRequestParams
    ).requestDataPackages();
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

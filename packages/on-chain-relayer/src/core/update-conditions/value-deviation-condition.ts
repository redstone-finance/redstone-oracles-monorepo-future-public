import {
  DataPackagesResponse,
  getDataPackagesTimestamp,
} from "@redstone-finance/sdk";
import { RelayerConfig } from "../../config/RelayerConfig";
import { LastRoundDetails } from "../../types";
import { checkValueDeviationCondition } from "./check-value-deviation-condition";

export const valueDeviationCondition = async (
  dataFeedId: string,
  latestDataPackages: DataPackagesResponse,
  lastRoundDetails: LastRoundDetails,
  config: RelayerConfig,
  historicalDataPackagesFetchCallback: () => Promise<DataPackagesResponse>
) => {
  const { shouldUpdatePrices, maxDeviationRatio, warningMessage } =
    checkValueDeviationCondition(
      dataFeedId,
      latestDataPackages,
      lastRoundDetails.lastValue,
      config
    );

  const isFallback = config.fallbackOffsetInMilliseconds > 0;
  let historicalShouldUpdatePrices = true;
  let historicalWarningMessage = "";
  let historicalMaxDeviation = 0;
  let historicalPackagesTime = undefined;

  if ((shouldUpdatePrices || config.isNotLazy) && isFallback) {
    const historicalDataPackages = await historicalDataPackagesFetchCallback();

    const {
      shouldUpdatePrices: historicalShouldUpdatePricesTmp,
      maxDeviationRatio: historicalMaxDeviationTmp,
      warningMessage: historicalWarningMessageTmp,
    } = checkValueDeviationCondition(
      dataFeedId,
      historicalDataPackages,
      lastRoundDetails.lastValue,
      config
    );

    historicalPackagesTime = getDataPackagesTimestamp(
      historicalDataPackages,
      dataFeedId
    );
    historicalShouldUpdatePrices = historicalShouldUpdatePricesTmp;
    historicalMaxDeviation = historicalMaxDeviationTmp;
    historicalWarningMessage = ` AND Historical ${historicalWarningMessageTmp}`;
  }

  const lastUpdateTimestampOffset =
    Date.now() - lastRoundDetails.lastBlockTimestampMS;
  const isLastUpdateNewerThanFallbackOffset =
    lastUpdateTimestampOffset < config.fallbackOffsetInMilliseconds;
  const isLastPackageNewerThanHistorical =
    historicalPackagesTime !== undefined &&
    lastRoundDetails.lastDataPackageTimestampMS >= historicalPackagesTime;
  const skipFallbackUpdate =
    isFallback &&
    config.fallbackSkipDeviationBasedFrequentUpdates &&
    (isLastUpdateNewerThanFallbackOffset || isLastPackageNewerThanHistorical);

  const shouldUpdatePricesNoSkip =
    shouldUpdatePrices && historicalShouldUpdatePrices;
  let updateSkippedMessage = isLastUpdateNewerThanFallbackOffset
    ? `less than ${config.fallbackOffsetInMilliseconds} milliseconds passed since last update (${lastUpdateTimestampOffset}); `
    : "";
  updateSkippedMessage += isLastPackageNewerThanHistorical
    ? `last updated package timestamp (${lastRoundDetails.lastDataPackageTimestampMS}) is newer that the historical one (${historicalPackagesTime}); `
    : "";

  updateSkippedMessage =
    updateSkippedMessage !== ""
      ? `Update skipped: ${updateSkippedMessage}`
      : "";

  const skipFallbackMessage =
    shouldUpdatePricesNoSkip && skipFallbackUpdate ? updateSkippedMessage : "";
  const prefix = isFallback ? "Deviation in fallback mode: " : "";

  return {
    shouldUpdatePrices: shouldUpdatePricesNoSkip && !skipFallbackUpdate,
    maxDeviationRatio: Math.max(maxDeviationRatio, historicalMaxDeviation),
    messages: [
      {
        message: `${prefix}${skipFallbackMessage}${warningMessage}${historicalWarningMessage}`,
      },
    ],
  };
};

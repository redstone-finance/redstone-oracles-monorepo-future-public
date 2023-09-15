import { RelayerConfig } from "../../types";

export const timeUpdateCondition = (
  lastUpdateTimestamp: number,
  config: RelayerConfig,
) => {
  const { fallbackOffsetInMS } = config;
  const isFallback = fallbackOffsetInMS > 0;
  let updatePriceInterval = config.updatePriceInterval;

  if (!updatePriceInterval) {
    throw "Update price interval must be defined";
  }

  if (isFallback) {
    updatePriceInterval += fallbackOffsetInMS;
  }

  const currentTimestamp = Date.now();
  const timeDiff = currentTimestamp - lastUpdateTimestamp;
  const shouldUpdatePrices = timeDiff >= updatePriceInterval;
  const logTrace = JSON.stringify({
    timeDiff,
    updatePriceInterval,
  });

  const warningMessage = shouldUpdatePrices
    ? `Enough time passed to updated prices: ${logTrace}`
    : `Not enough time has passed to update prices: ${logTrace}`;

  return {
    shouldUpdatePrices,
    warningMessage: `${isFallback ? "Fallback time: " : ""}${warningMessage}`,
  };
};

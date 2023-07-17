import { RelayerConfig } from "../../types";

const MS_IN_ONE_MINUTE = 60000;

export const timeUpdateCondition = (
  lastUpdateTimestamp: number,
  config: RelayerConfig
) => {
  const fallbackOffsetInMinutes = config.fallbackOffsetInMinutes ?? 0;
  const isFallback = fallbackOffsetInMinutes > 0;
  let updatePriceInterval = config.updatePriceInterval;

  if (!updatePriceInterval || isNaN(updatePriceInterval)) {
    throw "Update price interval must not be NaN";
  }

  if (isFallback) {
    updatePriceInterval += MS_IN_ONE_MINUTE * fallbackOffsetInMinutes;
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

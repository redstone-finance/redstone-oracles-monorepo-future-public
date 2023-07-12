export const timeUpdateCondition = (
  lastUpdateTimestamp: number,
  updatePriceInterval: number
) => {
  if (isNaN(updatePriceInterval)) {
    throw "Update price interval must not be NaN";
  }

  const currentTimestamp = Date.now();
  const timeDiff = currentTimestamp - lastUpdateTimestamp;
  const shouldUpdatePrices = timeDiff >= updatePriceInterval;
  const logTrace = JSON.stringify({
    timeDiff,
    updatePriceInterval,
  });
  return {
    shouldUpdatePrices,
    warningMessage: shouldUpdatePrices
      ? `Enough time passed to updated prices: ${logTrace}`
      : `Not enough time has passed to update prices: ${logTrace}`,
  };
};

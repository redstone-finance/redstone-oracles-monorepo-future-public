import { config } from "../../config";

export const timeUpdateCondition = (lastUpdateTimestamp: number) => {
  const updatePriceInterval = config.updatePriceInterval;
  const currentTimestamp = Date.now();
  const timeDiff = currentTimestamp - lastUpdateTimestamp;
  const shouldUpdatePrices = timeDiff >= updatePriceInterval;
  return {
    shouldUpdatePrices,
    warningMessage: shouldUpdatePrices
      ? ""
      : "Not enough time has passed to update prices",
  };
};

import { config } from "../../config";

export const timeUpdateCondition = (lastUpdateTimestamp: number) => {
  const updatePriceInterval = Number(config.updatePriceInterval);
  const currentTimestamp = Date.now();
  return currentTimestamp - lastUpdateTimestamp >= updatePriceInterval;
};

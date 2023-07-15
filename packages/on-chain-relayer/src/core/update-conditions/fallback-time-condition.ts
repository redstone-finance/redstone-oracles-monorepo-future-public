import { RelayerConfig } from "../../types";
import { timeUpdateCondition } from "./time-condition";

const MS_IN_ONE_MINUTE = 60000;

export const fallbackTimeCondition = (
  lastUpdateTimestamp: number,
  config: RelayerConfig
) => {
  const requiredTimeInterval =
    config.updatePriceInterval! +
    MS_IN_ONE_MINUTE * config.fallbackOffsetInMinutes!;

  const { shouldUpdatePrices, warningMessage } = timeUpdateCondition(
    lastUpdateTimestamp,
    requiredTimeInterval
  );

  return {
    shouldUpdatePrices: shouldUpdatePrices,
    warningMessage: `Fallback time: ${warningMessage}`,
  };
};

import cronParser from "cron-parser";
import { RelayerConfig } from "../../types";

export const cronCondition = (
  lastUpdateTimestamp: number,
  config: RelayerConfig
) => {
  const currentTimestamp = Date.now();
  const lastExpectedUpdateTime = cronParser
    .parseExpression(config.cronExpression || "", {
      // We move current time a bit back for the case with fallback
      currentDate: new Date(currentTimestamp - config.fallbackOffsetInMS),
    })
    .prev();

  const timeElapsedSinceLatestUpdate = currentTimestamp - lastUpdateTimestamp;

  // We want to update price only if there are no update txs after the previous
  // suitable time
  const maxAllowedTimeSinceLatestUpdate =
    currentTimestamp - lastExpectedUpdateTime.getTime();
  const shouldUpdatePrices =
    maxAllowedTimeSinceLatestUpdate < timeElapsedSinceLatestUpdate;

  const logTrace = JSON.stringify({
    type: "cron",
    timeElapsedSinceLatestUpdate,
    maxAllowedTimeSinceLatestUpdate,
  });

  const warningMessage = shouldUpdatePrices
    ? `Should update prices according to cron expr: ${logTrace}`
    : `Should not update prices according to cron expr: ${logTrace}`;

  return {
    shouldUpdatePrices,
    warningMessage,
  };
};

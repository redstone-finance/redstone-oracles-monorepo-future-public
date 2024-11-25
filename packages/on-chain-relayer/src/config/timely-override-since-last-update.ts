import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import _ from "lodash";
import { RelayerConfig } from "./RelayerConfig";

const logger = loggerFactory("relayer/config");

export const timelyOverrideSinceLastUpdate = (
  relayerConfig: RelayerConfig,
  temporaryUpdatePriceInterval: number
) => {
  const oldUpdateConditions = _.cloneDeep(relayerConfig.updateConditions);
  const oldUpdateTriggers = _.cloneDeep(relayerConfig.updateTriggers);

  for (const dataFeedId of relayerConfig.dataFeeds) {
    relayerConfig.updateTriggers[dataFeedId].timeSinceLastUpdateInMilliseconds =
      Math.min(
        temporaryUpdatePriceInterval,
        relayerConfig.updateTriggers[dataFeedId]
          .timeSinceLastUpdateInMilliseconds ?? temporaryUpdatePriceInterval
      );
    if (!relayerConfig.updateConditions[dataFeedId].includes("time")) {
      relayerConfig.updateConditions[dataFeedId].push("time");
    }
  }

  const temporaryUpdateDuration = Math.floor(
    temporaryUpdatePriceInterval * 1.5
  );
  logger.log(
    `Timely overriding updatePriceInterval to ${RedstoneCommon.msToMin(
      temporaryUpdatePriceInterval
    ).toFixed(2)} [min] for ${RedstoneCommon.msToMin(
      temporaryUpdateDuration
    ).toFixed(2)} [min]`
  );

  setTimeout(() => {
    relayerConfig.updateTriggers = oldUpdateTriggers;
    relayerConfig.updateConditions = oldUpdateConditions;
    logger.log(`Reverting updatePriceIntervals`);
  }, temporaryUpdateDuration);
};

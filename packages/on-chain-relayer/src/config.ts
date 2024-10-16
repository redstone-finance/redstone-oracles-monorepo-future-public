import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import _ from "lodash";
import { ConfigProvider, RelayerConfig } from "./types";

let configProvider: ConfigProvider | undefined = undefined;
let relayerConfig: RelayerConfig | undefined = undefined;

export const config = () => {
  if (relayerConfig) {
    return relayerConfig;
  }
  if (!configProvider) {
    throw new Error(
      "Config provider not defined. Consider calling setConfigProvider method."
    );
  }
  relayerConfig = configProvider();

  // Validating adapter contract type
  if (
    !["mento", "price-feeds", "multi-feed", "fuel"].includes(
      relayerConfig.adapterContractType
    )
  ) {
    throw new Error(
      `Adapter contract type not supported: ${relayerConfig.adapterContractType}`
    );
  }

  return relayerConfig;
};

const logger = loggerFactory("relayer/config");

export const setConfigProvider = (provider: ConfigProvider) => {
  relayerConfig = undefined;
  configProvider = provider;
};

export const timelyOverrideSinceLastUpdate = (
  temporaryUpdatePriceInterval: number
) => {
  RedstoneCommon.assert(
    relayerConfig,
    "[BUG] It should never happen. Fix code..."
  );
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
    relayerConfig!.updateTriggers = oldUpdateTriggers;
    relayerConfig!.updateConditions = oldUpdateConditions;
    logger.log(`Reverting updatePriceIntervals`);
  }, temporaryUpdateDuration);
};

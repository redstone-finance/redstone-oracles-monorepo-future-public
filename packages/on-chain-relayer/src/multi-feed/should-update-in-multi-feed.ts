import { checkConditionByName } from "../core/update-conditions/check-condition-by-name";
import { checkIfDataPackageTimestampIsNewer } from "../core/update-conditions/data-packages-timestamp";
import {
  IterationArgsMessage,
  RelayerConfig,
  ShouldUpdateContext,
  ShouldUpdateResponse,
} from "../types";

export const shouldUpdateInMultiFeed = async (
  context: ShouldUpdateContext,
  config: RelayerConfig
): Promise<ShouldUpdateResponse> => {
  const dataFeedsToUpdate: string[] = [];
  const warningMessages: IterationArgsMessage[] = [];
  const dataFeedsDeviationRatios: Record<string, number> = {};
  const heartbeatUpdates: Set<number> = new Set();
  const pictogram = config.runWithMqtt ? "ℹ️" : "⛔";
  for (const [dataFeedId, updateConditions] of Object.entries(
    config.updateConditions
  )) {
    if (!Object.keys(context.dataPackages).includes(dataFeedId)) {
      warningMessages.push({
        message: `${pictogram}Data package for feed: ${dataFeedId} is missing in the datasource${pictogram}`,
      });
      continue;
    }
    let shouldUpdatePrices = false;
    for (const conditionName of updateConditions) {
      const conditionCheck = await checkConditionByName(
        conditionName,
        dataFeedId,
        context,
        config
      );
      shouldUpdatePrices ||= conditionCheck.shouldUpdatePrices;
      warningMessages.push(...conditionCheck.messages);
      if (conditionCheck.maxDeviationRatio) {
        dataFeedsDeviationRatios[dataFeedId] = conditionCheck.maxDeviationRatio;
      }
      if (conditionCheck.shouldUpdatePrices && conditionName === "time") {
        heartbeatUpdates.add(
          config.updateTriggers[dataFeedId].timeSinceLastUpdateInMilliseconds!
        );
      }
    }

    const { shouldNotUpdatePrice, messages } =
      checkIfDataPackageTimestampIsNewer(context, dataFeedId);
    if (shouldNotUpdatePrice) {
      shouldUpdatePrices = false;
      warningMessages.push(...messages);
    }

    if (shouldUpdatePrices) {
      dataFeedsToUpdate.push(dataFeedId);
    }
  }

  return {
    dataFeedsToUpdate,
    dataFeedsDeviationRatios,
    heartbeatUpdates: Array.from(heartbeatUpdates),
    messages: warningMessages,
  };
};

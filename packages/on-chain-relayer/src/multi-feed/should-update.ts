import { checkConditionByName } from "../core/update-conditions/check-condition-by-name";
import { checkIfDataPackageTimestampIsNewer } from "../core/update-conditions/data-packages-timestamp";
import { Context, RelayerConfig, ShouldUpdateResponse } from "../types";

export const shouldUpdate = async (
  context: Context,
  config: RelayerConfig
): Promise<ShouldUpdateResponse> => {
  const dataFeedsToUpdate: string[] = [];
  const warningMessages: string[] = [];
  const dataFeedsDeviationRatios: Record<string, number> = {};
  const heartbeatUpdates: Set<number> = new Set();
  for (const [dataFeedId, updateConditions] of Object.entries(
    config.updateConditions
  )) {
    if (!Object.keys(context.dataPackages).includes(dataFeedId)) {
      warningMessages.push(
        `⛔Data feed: ${dataFeedId} couldn't be fetched from gateway.⛔`
      );
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
      if (conditionCheck.warningMessage.length > 0) {
        warningMessages.push(conditionCheck.warningMessage);
      }
      if (conditionCheck.maxDeviationRatio) {
        dataFeedsDeviationRatios[dataFeedId] = conditionCheck.maxDeviationRatio;
      }
      if (conditionCheck.shouldUpdatePrices && conditionName === "time") {
        heartbeatUpdates.add(
          config.updateTriggers[dataFeedId].timeSinceLastUpdateInMilliseconds!
        );
      }
    }

    const { shouldNotUpdatePrice, message } =
      checkIfDataPackageTimestampIsNewer(context, dataFeedId);
    if (shouldNotUpdatePrice) {
      shouldUpdatePrices = false;
      warningMessages.push(message!);
    }

    if (shouldUpdatePrices) {
      dataFeedsToUpdate.push(dataFeedId);
    }
  }

  return {
    dataFeedsToUpdate,
    dataFeedsDeviationRatios,
    heartbeatUpdates: Array.from(heartbeatUpdates),
    warningMessage: warningMessages.join("; "),
  };
};

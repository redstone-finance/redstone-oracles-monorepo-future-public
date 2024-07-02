import { ConditionCheckNames, ConditionCheckResponse } from "../../types";
import { Context, RelayerConfig, ShouldUpdateResponse } from "../types";
import { cronCondition } from "./cron-condition";
import { checkIfDataPackageTimestampIsNewer } from "./data-packages-timestamp";
import { timeUpdateCondition } from "./time-condition";
import { valueDeviationCondition } from "./value-deviation-condition";

export const shouldUpdate = async (
  context: Context,
  config: RelayerConfig
): Promise<ShouldUpdateResponse> => {
  const dataFeedsToUpdate: string[] = [];
  const warningMessages: string[] = [];
  for (const [dataFeedId, updateConditions] of Object.entries(
    config.updateConditions
  )) {
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
    }

    const { shouldNotUpdatePrice, message } =
      checkIfDataPackageTimestampIsNewer(dataFeedId, context);
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
    warningMessage: warningMessages.join("; "),
  };
};

const checkConditionByName = async (
  name: ConditionCheckNames,
  dataFeedId: string,
  context: Context,
  config: RelayerConfig
): Promise<ConditionCheckResponse> => {
  switch (name) {
    case "time":
      return timeUpdateCondition(
        dataFeedId,
        context.dataFromContract[dataFeedId].lastBlockTimestamp,
        config
      );

    case "cron":
      return cronCondition(
        dataFeedId,
        context.dataFromContract[dataFeedId].lastBlockTimestamp,
        config
      );

    case "value-deviation":
      return await valueDeviationCondition(
        dataFeedId,
        context.dataPackages,
        context.uniqueSignersThreshold,
        context.dataFromContract[dataFeedId].lastValue,
        context.dataFromContract[dataFeedId].lastBlockTimestamp,
        config
      );
  }
};

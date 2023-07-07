import { timeUpdateCondition } from "./time-condition";
import { valueDeviationCondition } from "./value-deviation-condition";
import { RelayerConfig } from "../../types";
import { ConditionCheckResponse, Context } from "../../types";

export const shouldUpdate = (context: Context, config: RelayerConfig): ConditionCheckResponse => {
  const warningMessages: string[] = [];
  let shouldUpdatePrices = false;
  for (const conditionName of config.updateConditions) {
    const conditionCheck = checkConditionByName(context, config)[conditionName];
    shouldUpdatePrices =
      shouldUpdatePrices || conditionCheck.shouldUpdatePrices;
    if (conditionCheck.warningMessage.length > 0) {
      warningMessages.push(conditionCheck.warningMessage);
    }
  }

  console.log(
    `Update condition ${
      shouldUpdatePrices ? "" : "NOT"
    } satisfied: ${warningMessages.join("; ")}`
  );

  return {
    shouldUpdatePrices,
    warningMessage: JSON.stringify(warningMessages),
  };
};

const checkConditionByName = (context: Context, config: RelayerConfig) => ({
  time: timeUpdateCondition(context.lastUpdateTimestamp, config),
  "value-deviation": valueDeviationCondition(
    context.dataPackages,
    context.valuesFromContract,
    config
  ),
});

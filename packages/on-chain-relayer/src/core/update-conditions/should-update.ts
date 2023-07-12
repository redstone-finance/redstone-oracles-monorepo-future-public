import { timeUpdateCondition } from "./time-condition";
import { valueDeviationCondition } from "./value-deviation-condition";
import {
  ConditionCheckNames,
  ConditionCheckResponse,
  Context,
  RelayerConfig,
} from "../../types";
import { fallbackDeviationCondition } from "./fallback-deviation-condition";
import { fallbackTimeCondition } from "./fallback-time-condition";

export const shouldUpdate = (
  context: Context,
  config: RelayerConfig
): ConditionCheckResponse => {
  const warningMessages: string[] = [];
  let shouldUpdatePrices = false;
  for (const conditionName of config.updateConditions) {
    const conditionCheck = checkConditionByName(conditionName, context, config);
    shouldUpdatePrices ||= conditionCheck.shouldUpdatePrices;
    if (conditionCheck.warningMessage.length > 0) {
      warningMessages.push(conditionCheck.warningMessage);
    }
  }

  console.log(
    `Update condition ${
      shouldUpdatePrices ? "" : "NOT "
    }satisfied: ${warningMessages.join("; ")}`
  );

  return {
    shouldUpdatePrices,
    warningMessage: JSON.stringify(warningMessages),
  };
};

const checkConditionByName = (
  name: ConditionCheckNames,
  context: Context,
  config: RelayerConfig
) => {
  switch (name) {
    case "time":
      return timeUpdateCondition(
        context.lastUpdateTimestamp,
        config.updatePriceInterval!
      );

    case "value-deviation":
      return valueDeviationCondition(
        context.dataPackages,
        context.valuesFromContract,
        config
      );

    case "fallback-deviation":
      return fallbackDeviationCondition(
        context.dataPackages,
        context.olderDataPackages!,
        context.valuesFromContract,
        config
      );

    case "fallback-time":
      return fallbackTimeCondition(context.lastUpdateTimestamp, config);
  }
};

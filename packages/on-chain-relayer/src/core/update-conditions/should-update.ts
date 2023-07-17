import { timeUpdateCondition } from "./time-condition";
import {
  ConditionCheckNames,
  ConditionCheckResponse,
  Context,
  RelayerConfig,
} from "../../types";
import { valueDeviationCondition } from "./value-deviation-condition";

export const shouldUpdate = async (
  context: Context,
  config: RelayerConfig
): Promise<ConditionCheckResponse> => {
  const warningMessages: string[] = [];
  let shouldUpdatePrices = false;
  for (const conditionName of config.updateConditions) {
    const conditionCheck = await checkConditionByName(
      conditionName,
      context,
      config
    );
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

const checkConditionByName = async (
  name: ConditionCheckNames,
  context: Context,
  config: RelayerConfig
) => {
  switch (name) {
    case "time":
      return timeUpdateCondition(context.lastUpdateTimestamp, config);

    case "value-deviation":
      return await valueDeviationCondition(
        context.dataPackages,
        context.uniqueSignersThreshold,
        context.valuesFromContract,
        config
      );
  }
};

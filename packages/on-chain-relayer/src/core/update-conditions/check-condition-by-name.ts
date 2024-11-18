import {
  ConditionCheckNames,
  ConditionCheckResponse,
  RelayerConfig,
  ShouldUpdateContext,
} from "../../types";
import { cronCondition } from "./cron-condition";
import { timeUpdateCondition } from "./time-condition";
import { valueDeviationCondition } from "./value-deviation-condition";

export const checkConditionByName = async (
  name: ConditionCheckNames,
  dataFeedId: string,
  context: ShouldUpdateContext,
  config: RelayerConfig
): Promise<ConditionCheckResponse> => {
  switch (name) {
    case "time":
      return timeUpdateCondition(
        dataFeedId,
        context.dataFromContract[dataFeedId].lastBlockTimestampMS,
        config
      );

    case "cron":
      return cronCondition(
        dataFeedId,
        context.dataFromContract[dataFeedId].lastBlockTimestampMS,
        config
      );

    case "value-deviation":
      return await valueDeviationCondition(
        dataFeedId,
        context.dataPackages,
        context.uniqueSignersThreshold,
        context.dataFromContract[dataFeedId],
        config
      );
  }
};

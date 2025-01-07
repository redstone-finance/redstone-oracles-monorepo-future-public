import { getLastRoundDetails } from "@redstone-finance/sdk";
import { ConditionCheckNames, RelayerConfig } from "../../config/RelayerConfig";
import { ConditionCheckResponse, ShouldUpdateContext } from "../../types";
import { cronCondition } from "./cron-condition";
import { timeUpdateCondition } from "./time-condition";
import { valueDeviationCondition } from "./value-deviation-condition";

export const checkConditionByName = async (
  name: ConditionCheckNames,
  dataFeedId: string,
  context: ShouldUpdateContext,
  config: RelayerConfig
): Promise<ConditionCheckResponse> => {
  const lastRoundDetails = getLastRoundDetails(
    context.dataFromContract,
    dataFeedId,
    true
  );

  switch (name) {
    case "time":
      return timeUpdateCondition(
        dataFeedId,
        lastRoundDetails.lastBlockTimestampMS,
        config
      );

    case "cron":
      return cronCondition(
        dataFeedId,
        lastRoundDetails.lastBlockTimestampMS,
        config
      );

    case "value-deviation":
      return await valueDeviationCondition(
        dataFeedId,
        context.dataPackages,
        context.uniqueSignersThreshold,
        lastRoundDetails,
        config
      );
  }
};

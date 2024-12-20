import { BigNumber } from "ethers";
import _ from "lodash";
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
  let lastRoundDetails = context.dataFromContract[dataFeedId];
  if (_.isEmpty(lastRoundDetails)) {
    lastRoundDetails = {
      lastBlockTimestampMS: 0,
      lastDataPackageTimestampMS: 0,
      lastValue: BigNumber.from(0),
    };

    context.dataFromContract[dataFeedId] = lastRoundDetails;
  }

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

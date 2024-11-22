import { checkConditionByName } from "../core/update-conditions/check-condition-by-name";
import { checkIfDataPackageTimestampIsNewer } from "../core/update-conditions/data-packages-timestamp";
import { checkIfDataPackagesDecimalsAreAcceptable } from "../custom-integrations/mento/data-packages-decimals";
import {
  ConditionCheckResponse,
  IterationArgsMessage,
  RelayerConfig,
  ShouldUpdateContext,
} from "../types";

export const shouldUpdate = async (
  context: ShouldUpdateContext,
  config: RelayerConfig
): Promise<ConditionCheckResponse> => {
  const warningMessages: IterationArgsMessage[] = [];
  let shouldUpdatePrices = false;
  for (const dataFeedId of config.dataFeeds) {
    for (const conditionName of config.updateConditions[dataFeedId]) {
      const conditionCheck = await checkConditionByName(
        conditionName,
        dataFeedId,
        context,
        config
      );
      shouldUpdatePrices ||= conditionCheck.shouldUpdatePrices;
      if (conditionCheck.messages.length > 0) {
        warningMessages.push(...conditionCheck.messages);
      }
    }

    let { shouldNotUpdatePrice, messages } = checkIfDataPackageTimestampIsNewer(
      context,
      dataFeedId
    );
    if (shouldNotUpdatePrice) {
      shouldUpdatePrices = false;
      warningMessages.push(...messages);
    }

    ({ shouldNotUpdatePrice, messages } =
      checkIfDataPackagesDecimalsAreAcceptable(context, config));
    if (shouldNotUpdatePrice) {
      shouldUpdatePrices = false;
      warningMessages.push(...messages);
    }
  }

  return {
    shouldUpdatePrices,
    messages: warningMessages,
  };
};

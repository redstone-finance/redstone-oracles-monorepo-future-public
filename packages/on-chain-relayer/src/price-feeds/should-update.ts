import { checkConditionByName } from "../core/update-conditions/check-condition-by-name";
import { checkIfDataPackageTimestampIsNewer } from "../core/update-conditions/data-packages-timestamp";
import { checkIfDataPackagesDecimalsAreAcceptable } from "../custom-integrations/mento/data-packages-decimals";
import { ConditionCheckResponse, Context, RelayerConfig } from "../types";

export const shouldUpdate = async (
  context: Context,
  config: RelayerConfig
): Promise<ConditionCheckResponse> => {
  const warningMessages: string[] = [];
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
      if (conditionCheck.warningMessage.length > 0) {
        warningMessages.push(conditionCheck.warningMessage);
      }
    }

    let { shouldNotUpdatePrice, message } = checkIfDataPackageTimestampIsNewer(
      context,
      dataFeedId
    );
    if (shouldNotUpdatePrice) {
      shouldUpdatePrices = false;
      warningMessages.push(message!);
    }

    ({ shouldNotUpdatePrice, message } =
      checkIfDataPackagesDecimalsAreAcceptable(context, config));
    if (shouldNotUpdatePrice) {
      shouldUpdatePrices = false;
      warningMessages.push(message!);
    }
  }

  return {
    shouldUpdatePrices,
    warningMessage: warningMessages.join("; "),
  };
};

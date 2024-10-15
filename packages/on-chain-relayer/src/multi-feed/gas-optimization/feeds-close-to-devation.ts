import { RelayerConfig } from "../../types";

export const includeFeedsCloseToDeviation = (
  dataFeedsToUpdate: string[],
  dataFeedsDeviations: Record<string, number>,
  config: RelayerConfig
) => {
  const { multiFeedAdditionalUpdatesDeviationThreshold } = config;
  if (!multiFeedAdditionalUpdatesDeviationThreshold) {
    return {
      dataFeedsToUpdate,
      message: "",
    };
  }
  const messages: string[] = [];
  for (const [dataFeedId, deviation] of Object.entries(dataFeedsDeviations)) {
    if (
      !dataFeedsToUpdate.includes(dataFeedId) &&
      deviation >= multiFeedAdditionalUpdatesDeviationThreshold
    ) {
      messages.push(
        `DataFeed: ${dataFeedId} deviated enough: ${Number(deviation.toFixed(2)) * 100}% of deviation condition, to be included in update`
      );
      dataFeedsToUpdate.push(dataFeedId);
    }
  }
  return {
    dataFeedsToUpdate,
    message: messages.join("; "),
  };
};

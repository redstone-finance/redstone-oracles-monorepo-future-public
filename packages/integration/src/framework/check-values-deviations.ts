import { consts } from "@redstone-finance/protocol";
import { DeviationsWithBigPackage } from "./run-long-price-propagation-core-test";

export const checkValuesDeviations = (
  deviationsPerDataFeed: DeviationsWithBigPackage,
  maxPercentageValueDifference: number
) => {
  let deviationsBiggerThanAllowed = 0;
  const dataFeeds = Object.keys(deviationsPerDataFeed);
  for (const dataFeedId of dataFeeds) {
    if (dataFeedId === consts.ALL_FEEDS_KEY) {
      const deviationsFromBigPackage =
        deviationsPerDataFeed[consts.ALL_FEEDS_KEY]!;
      checkValuesDeviations(
        deviationsFromBigPackage as DeviationsWithBigPackage,
        maxPercentageValueDifference
      );
      continue;
    }
    const deviation = deviationsPerDataFeed[dataFeedId];
    if (deviation > maxPercentageValueDifference) {
      console.log(
        `Value deviation for ${dataFeedId} is bigger than maximum (${maxPercentageValueDifference}%) - ${deviation}%`
      );
      deviationsBiggerThanAllowed += 1;
    }
  }

  if (deviationsBiggerThanAllowed > 0) {
    throw new Error(
      `Found deviations bigger than maximum ${maxPercentageValueDifference}%`
    );
  }
};

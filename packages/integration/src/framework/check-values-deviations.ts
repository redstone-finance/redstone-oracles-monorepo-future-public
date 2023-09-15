import { consts } from "@redstone-finance/protocol";
import {
  DeviationsPerDataFeed,
  DeviationsWithBigPackage,
} from "./run-long-price-propagation-core-test";

export const checkValuesDeviations = (
  deviationsPerDataFeed: DeviationsWithBigPackage,
  maxPercentageValueDifference: number
) => {
  let deviationsBiggerThanAllowed = 0;
  const dataFeeds = Object.keys(deviationsPerDataFeed);
  for (const dataFeedId of dataFeeds) {
    const ALL_FEEDS_KEY = consts.ALL_FEEDS_KEY as string;
    if (dataFeedId === ALL_FEEDS_KEY) {
      const deviationsFromBigPackage = deviationsPerDataFeed[
        ALL_FEEDS_KEY
      ] as DeviationsPerDataFeed;
      checkValuesDeviations(
        deviationsFromBigPackage,
        maxPercentageValueDifference
      );
      continue;
    }
    const deviation = deviationsPerDataFeed[dataFeedId] as number;
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

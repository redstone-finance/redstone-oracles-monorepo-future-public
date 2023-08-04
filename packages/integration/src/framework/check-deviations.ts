import {
  ALL_FEEDS_DATA_FEED_ID,
  DeviationsPerDataFeed,
  DeviationsWithBigPackage,
} from "./run-long-price-propagation-core-test";

export const checkDeviations = (
  deviationsPerDataFeed: DeviationsWithBigPackage,
  maxPercentageValueDifference: number
) => {
  let deviationsBiggerThanAllowed = 0;
  const dataFeeds = Object.keys(deviationsPerDataFeed);
  for (const dataFeedId of dataFeeds) {
    if (dataFeedId === ALL_FEEDS_DATA_FEED_ID) {
      const deviationsFromBigPackage = deviationsPerDataFeed[
        ALL_FEEDS_DATA_FEED_ID
      ] as DeviationsPerDataFeed;
      checkDeviations(deviationsFromBigPackage, maxPercentageValueDifference);
      continue;
    }
    const deviation = deviationsPerDataFeed[dataFeedId] as number;
    if (deviation > maxPercentageValueDifference) {
      console.log(
        `Value deviation for ${dataFeedId} is bigger than maximum (${maxPercentageValueDifference}%) - ${deviation}%`
      );
      deviationsBiggerThanAllowed += 1;
    }

    if (deviationsBiggerThanAllowed > 0) {
      throw new Error(
        `Found deviations bigger than maximum ${maxPercentageValueDifference}%`
      );
    }
  }
};

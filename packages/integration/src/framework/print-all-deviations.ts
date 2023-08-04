import {
  ALL_FEEDS_DATA_FEED_ID,
  DeviationsPerDataFeed,
  DeviationsWithBigPackage,
} from "./run-long-price-propagation-core-test";

export const printAllDeviations = (
  deviationsPerDataFeed: DeviationsWithBigPackage,
  isBigPackage: boolean = false
) => {
  const dataFeeds = Object.keys(deviationsPerDataFeed);
  for (const dataFeedId of dataFeeds) {
    if (dataFeedId === ALL_FEEDS_DATA_FEED_ID) {
      const deviationsFromBigPackage = deviationsPerDataFeed[
        ALL_FEEDS_DATA_FEED_ID
      ] as DeviationsPerDataFeed;
      printAllDeviations(deviationsFromBigPackage, true);
      continue;
    }
    const deviation = deviationsPerDataFeed[dataFeedId] as number;
    logDeviation(dataFeedId, deviation, isBigPackage);
  }
};

const logDeviation = (
  dataFeedId: string,
  deviation: number,
  isBigPackage: boolean
) => {
  console.log(
    `Max deviation ${
      isBigPackage ? "from big package" : ""
    } for ${dataFeedId} - ${deviation}`
  );
};

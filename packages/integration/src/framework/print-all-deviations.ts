import { consts } from "redstone-protocol";
import {
  DeviationsPerDataFeed,
  DeviationsWithBigPackage,
} from "./run-long-price-propagation-core-test";

export const printAllDeviations = (
  deviationsPerDataFeed: DeviationsWithBigPackage,
  isBigPackage: boolean = false
) => {
  const dataFeeds = Object.keys(deviationsPerDataFeed);
  for (const dataFeedId of dataFeeds) {
    const ALL_FEEDS_KEY = consts.ALL_FEEDS_KEY as string;
    if (dataFeedId === ALL_FEEDS_KEY) {
      const deviationsFromBigPackage = deviationsPerDataFeed[
        ALL_FEEDS_KEY
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

import { consts } from "@redstone-finance/protocol";
import { DeviationsWithBigPackage } from "./run-long-price-propagation-core-test";

export const printAllDeviations = (
  deviationsPerDataFeed: DeviationsWithBigPackage,
  isBigPackage: boolean = false
) => {
  const dataFeeds = Object.keys(deviationsPerDataFeed);
  for (const dataFeedId of dataFeeds) {
    if (dataFeedId === consts.ALL_FEEDS_KEY) {
      const deviationsFromBigPackage =
        deviationsPerDataFeed[consts.ALL_FEEDS_KEY]!;
      printAllDeviations(
        deviationsFromBigPackage as DeviationsWithBigPackage,
        true
      );
      continue;
    }
    const deviation = deviationsPerDataFeed[dataFeedId];
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

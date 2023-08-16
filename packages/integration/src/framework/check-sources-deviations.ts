import { SourceDeviationsPerDataFeed } from "./run-long-price-propagation-core-test";

export const checkSourcesDeviations = (
  deviationsPerDataFeed: SourceDeviationsPerDataFeed,
  maxPercentageValueDifference: number
) => {
  let deviationsBiggerThanAllowed = 0;
  const dataFeeds = Object.keys(deviationsPerDataFeed);
  for (const dataFeedId of dataFeeds) {
    const deviationsPerSource = deviationsPerDataFeed[dataFeedId];
    for (const [source, deviation] of Object.entries(deviationsPerSource)) {
      if (deviation > maxPercentageValueDifference) {
        console.log(
          `Source deviation for ${dataFeedId} from ${source} is bigger than maximum (${maxPercentageValueDifference}%) - ${deviation}%`
        );
        deviationsBiggerThanAllowed += 1;
      }
    }
  }

  if (deviationsBiggerThanAllowed > 0) {
    throw new Error(
      `Found deviations bigger than maximum ${maxPercentageValueDifference}%`
    );
  }
};

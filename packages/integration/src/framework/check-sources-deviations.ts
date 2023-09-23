import { SourceDeviationsPerDataFeed } from "./run-long-price-propagation-core-test";

export const checkSourcesDeviations = (
  deviationsPerDataFeed: SourceDeviationsPerDataFeed,
  maxPercentageValueDifference: number,
  sourcesToSkip: string[]
) => {
  let deviationsBiggerThanAllowed = 0;
  const dataFeeds = Object.keys(deviationsPerDataFeed);
  for (const dataFeedId of dataFeeds) {
    const deviationsPerSource = deviationsPerDataFeed[dataFeedId];
    for (const [source, deviation] of Object.entries(deviationsPerSource)) {
      if (deviation > maxPercentageValueDifference) {
        const ignoreDeviation = sourcesToSkip.includes(source);
        console.log(
          `Source deviation for ${dataFeedId} from ${source} is bigger than maximum (${maxPercentageValueDifference}%) - ${deviation}%${
            ignoreDeviation ? " (ignored)" : ""
          }`
        );
        if (!ignoreDeviation) {
          deviationsBiggerThanAllowed += 1;
        }
      }
    }
  }

  if (deviationsBiggerThanAllowed > 0) {
    throw new Error(
      `Found deviations bigger than maximum ${maxPercentageValueDifference}%`
    );
  }
};

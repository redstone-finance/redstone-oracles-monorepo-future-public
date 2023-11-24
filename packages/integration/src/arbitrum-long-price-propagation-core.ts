import { runLongPricePropagationCoreTest } from "./framework/run-long-price-propagation-core-test";

const REMOVED_DATA_FEEDS: string[] = [
  "SUSHI_DPX_ETH_LP",
  "MOO_SUSHI_DPX_ETH_LP",
  "DPX",
];
const DATA_FEEDS_NOT_WORKING_LOCALLY: string[] = [];
const SKIPPED_SOURCES = JSON.parse(
  process.env.SKIPPED_SOURCES ?? "[]"
) as string[];

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const manifestFileName = "data-services/arbitrum";
  const nodeWorkingTimeInMinutes = 3;
  const nodeIntervalInMilliseconds = 10000;
  const coldStartIterationsCount = 3;
  await runLongPricePropagationCoreTest(
    manifestFileName,
    nodeWorkingTimeInMinutes,
    nodeIntervalInMilliseconds,
    coldStartIterationsCount,
    REMOVED_DATA_FEEDS,
    DATA_FEEDS_NOT_WORKING_LOCALLY,
    SKIPPED_SOURCES
  );
})();

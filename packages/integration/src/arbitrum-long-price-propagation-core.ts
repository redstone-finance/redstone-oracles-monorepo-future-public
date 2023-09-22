import { runLongPricePropagationCoreTest } from "./framework/run-long-price-propagation-core-test";

const skippedSources = JSON.parse(
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
    skippedSources
  );
})();

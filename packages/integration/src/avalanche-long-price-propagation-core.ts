import { runLongPricePropagationCoreTest } from "./framework/run-long-price-propagation-core-test";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const manifestFileName = "avalanche";
  const nodeWorkingTimeInMinutes = 15;
  const nodeIntervalInMilliseconds = 60000;
  const coldStartIterationsCount = 4;
  await runLongPricePropagationCoreTest(
    manifestFileName,
    nodeWorkingTimeInMinutes,
    nodeIntervalInMilliseconds,
    coldStartIterationsCount
  );
})();

import { runLongPricePropagationCoreTest } from "./framework/run-long-price-propagation-core-test";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const manifestFileName = "data-services/avalanche";
  const nodeWorkingTimeInMinutes = 3;
  const nodeIntervalInMilliseconds = 10000;
  const coldStartIterationsCount = 4;
  await runLongPricePropagationCoreTest(
    manifestFileName,
    nodeWorkingTimeInMinutes,
    nodeIntervalInMilliseconds,
    coldStartIterationsCount
  );
})();

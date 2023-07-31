import { runLongPricePropagationCoreTest } from "./framework/run-long-price-propagation-core-test";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const manifestFileName = "data-services/primary";
  const nodeWorkingTimeInMinutes = 15;
  const nodeIntervalInMilliseconds = 60000;
  const coldStartIterationsCount = 3;
  await runLongPricePropagationCoreTest(
    manifestFileName,
    nodeWorkingTimeInMinutes,
    nodeIntervalInMilliseconds,
    coldStartIterationsCount
  );
})();

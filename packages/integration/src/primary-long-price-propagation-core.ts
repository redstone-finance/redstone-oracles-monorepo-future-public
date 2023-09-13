import { runLongPricePropagationCoreTest } from "./framework/run-long-price-propagation-core-test";

const REMOVED_DATA_FEEDS: string[] = [];
const DATA_FEEDS_NOT_WORKING_LOCALLY = ["PREMIA-TWAP-60"];

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const manifestFileName = "data-services/primary";
  const nodeWorkingTimeInMinutes = 3;
  const nodeIntervalInMilliseconds = 10000;
  const coldStartIterationsCount = 3;
  await runLongPricePropagationCoreTest(
    manifestFileName,
    nodeWorkingTimeInMinutes,
    nodeIntervalInMilliseconds,
    coldStartIterationsCount,
    REMOVED_DATA_FEEDS,
    DATA_FEEDS_NOT_WORKING_LOCALLY
  );
})();

import { runLongPricePropagationCoreTest } from "./framework/run-long-price-propagation-core-test";

const REMOVED_DATA_FEEDS = [
  "DAI",
  "YYAV3SA1",
  "TJ_AVAX_USDC_AUTO",
  "BUSD",
  "XAVA",
  "LINK",
  "USDT.e",
  "SHLB_USDT.e-USDt_C",
];

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
    coldStartIterationsCount,
    REMOVED_DATA_FEEDS
  );
})();

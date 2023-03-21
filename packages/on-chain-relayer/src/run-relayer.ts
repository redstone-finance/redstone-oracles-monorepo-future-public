import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { requestDataPackages } from "redstone-sdk";
import { shouldUpdate } from "./core/update-conditions/should-update";
import { updatePrices } from "./core/contract-interactions/update-prices";
import { getLastRoundParamsFromContract } from "./core/contract-interactions/get-last-round-params";
import { getManagerContract } from "./core/contract-interactions/get-adapter-contract";
import { getValuesForDataFeeds } from "./core/contract-interactions/get-values-for-data-feeds";
import { sendHealthcheckPing } from "./core/monitoring/send-healthcheck-ping";
import { config } from "./config";

const { relayerIterationInterval } = config;

console.log(
  `Starting contract prices updater with interval ${relayerIterationInterval}`
);

const runRelayer = async () => {
  const { dataServiceId, uniqueSignersCount, dataFeeds, cacheServiceUrls } =
    config;
  const priceFeedsAdapterContract = await getManagerContract();
  const dataPackages = await requestDataPackages(
    {
      dataServiceId,
      uniqueSignersCount,
      dataFeeds,
    },
    cacheServiceUrls
  );

  const { lastRound, lastUpdateTimestamp } =
    await getLastRoundParamsFromContract(priceFeedsAdapterContract);
  const valuesFromContract = await getValuesForDataFeeds(
    priceFeedsAdapterContract,
    dataFeeds
  );
  const { shouldUpdatePrices, warningMessage } = shouldUpdate({
    dataPackages,
    valuesFromContract,
    lastUpdateTimestamp,
  });

  if (!shouldUpdatePrices) {
    console.log(`All conditions are not fulfilled: ${warningMessage}`);
  } else {
    await updatePrices(
      dataPackages,
      priceFeedsAdapterContract,
      lastUpdateTimestamp,
      lastRound
    );
  }

  await sendHealthcheckPing();
};

const task = new AsyncTask(
  "Relayer task",
  () => runRelayer(),
  (error) => console.log(error.stack)
);

const job = new SimpleIntervalJob(
  { milliseconds: relayerIterationInterval, runImmediately: true },
  task
);

const scheduler = new ToadScheduler();

scheduler.addSimpleIntervalJob(job);

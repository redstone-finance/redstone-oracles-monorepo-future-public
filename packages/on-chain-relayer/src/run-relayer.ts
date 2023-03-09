import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { shouldUpdate } from "./core/update-conditions/should-update";
import { updatePrices } from "./core/contract-interactions/update-prices";
import { getLastRoundParamsFromContract } from "./core/contract-interactions/get-last-round-params";
import { getManagerContract } from "./core/contract-interactions/get-manager-contract";
import { config } from "./config";

const { relayerIterationInterval } = config;

console.log(
  `Starting contract prices updater with interval ${relayerIterationInterval}`
);

const runRelayer = async () => {
  const priceFeedsManagerContract = await getManagerContract();

  const { lastRound, lastUpdateTimestamp } =
    await getLastRoundParamsFromContract(priceFeedsManagerContract);
  const shouldUpdatePrices = shouldUpdate(lastUpdateTimestamp);

  if (!shouldUpdatePrices) {
    console.log("Not enough time has passed to update prices");
  } else {
    updatePrices(priceFeedsManagerContract, lastUpdateTimestamp, lastRound);
  }
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

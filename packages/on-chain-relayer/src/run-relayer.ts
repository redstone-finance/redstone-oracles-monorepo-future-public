import { RedstoneCommon, sendHealthcheckPing } from "@redstone-finance/utils";
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { fileSystemConfigProvider } from "./FilesystemConfigProvider";
import { getIterationArgs } from "./args/get-iteration-args";
import { config, setConfigProvider } from "./config";
import { getAdapterContract } from "./core/contract-interactions/get-contract";
import { updatePrices } from "./core/contract-interactions/update-prices";
import { simulateUpdateDataFeeds } from "./core/simulate-price-feed-update";
import { markFirstIteration } from "./core/update-conditions/on-start-condition";

setConfigProvider(fileSystemConfigProvider);
const relayerConfig = config();

console.log(
  `Starting contract prices updater with interval ${relayerConfig.relayerIterationInterval}`
);

const runIteration = async () => {
  const adapterContract = getAdapterContract();
  const iterationArgs = await getIterationArgs(adapterContract);

  void sendHealthcheckPing(relayerConfig.healthcheckPingUrl);
  console.log(
    `Update condition ${
      iterationArgs.shouldUpdatePrices ? "" : "NOT "
    }satisfied: ${iterationArgs.message}`
  );

  if (iterationArgs.shouldUpdatePrices) {
    await updatePrices(iterationArgs.args);
  }
};

async function main() {
  const adapterContract = getAdapterContract();
  const iterationArgs = await getIterationArgs(adapterContract);

  try {
    await simulateUpdateDataFeeds(iterationArgs, adapterContract);
    markFirstIteration();
    await runIteration();
  } catch (e) {
    console.log("First transaction has failed:", e);
    const sleepTime = config().sleepMsAfterFailedSimulation;
    console.log(`Sleeping for ${sleepTime} ms before exiting`);
    await RedstoneCommon.sleep(sleepTime);
    console.log("Killing relayer");
    process.exit(1);
  }

  const task = new AsyncTask("Relayer task", runIteration, (error) =>
    console.log(
      "Unhandled error occurred during iteration:",
      RedstoneCommon.stringifyError(error)
    )
  );

  const job = new SimpleIntervalJob(
    {
      milliseconds: relayerConfig.relayerIterationInterval,
    },
    task,
    { preventOverrun: true }
  );

  const scheduler = new ToadScheduler();

  scheduler.addSimpleIntervalJob(job);
}

void main();

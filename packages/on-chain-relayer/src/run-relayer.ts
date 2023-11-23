import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { RedstoneCommon, sendHealthcheckPing } from "@redstone-finance/utils";
import { getIterationArgs } from "./args/get-iteration-args";
import { updatePrices } from "./core/contract-interactions/update-prices";
import { getAdapterContract } from "./core/contract-interactions/get-contract";
import { config, setConfigProvider } from "./config";
import { fileSystemConfigProvider } from "./FilesystemConfigProvider";

setConfigProvider(fileSystemConfigProvider);
const relayerConfig = config();

console.log(
  `Starting contract prices updater with interval ${relayerConfig.relayerIterationInterval}`
);

const runIteration = async () => {
  const adapterContract = getAdapterContract();
  const iterationArgs = await getIterationArgs(adapterContract);

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  sendHealthcheckPing(relayerConfig.healthcheckPingUrl);
  console.log(
    `Update condition ${
      iterationArgs.shouldUpdatePrices ? "" : "NOT "
    }satisfied: ${iterationArgs.message}`
  );

  if (iterationArgs.shouldUpdatePrices) {
    await updatePrices(iterationArgs.args);
  }
};

const task = new AsyncTask("Relayer task", runIteration, (error) =>
  console.log(
    "Unhandled error occurred during iteration:",
    RedstoneCommon.stringifyError(error)
  )
);

const job = new SimpleIntervalJob(
  {
    milliseconds: relayerConfig.relayerIterationInterval,
    runImmediately: true,
  },
  task,
  { preventOverrun: true }
);

const scheduler = new ToadScheduler();

scheduler.addSimpleIntervalJob(job);

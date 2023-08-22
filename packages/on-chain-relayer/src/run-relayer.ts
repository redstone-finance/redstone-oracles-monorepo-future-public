import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { getIterationArgs } from "./args/get-iteration-args";
import { updatePrices } from "./core/contract-interactions/update-prices";
import { getAdapterContract } from "./core/contract-interactions/get-contract";
import { sendHealthcheckPing } from "./core/monitoring/send-healthcheck-ping";
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
  await sendHealthcheckPing();

  if (iterationArgs.shouldUpdatePrices) {
    await updatePrices(iterationArgs.args);
  } else {
    console.log(iterationArgs.message);
  }
};

const task = new AsyncTask(
  "Relayer task",
  () => runIteration(),
  (error) => console.log(error.stack)
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

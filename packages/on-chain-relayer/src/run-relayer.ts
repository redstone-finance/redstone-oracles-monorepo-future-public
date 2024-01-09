import { RedstoneCommon, sendHealthcheckPing } from "@redstone-finance/utils";
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { fileSystemConfigProvider } from "./FilesystemConfigProvider";
import { getIterationArgs } from "./args/get-iteration-args";
import { config, setConfigProvider } from "./config";
import { getAdapterContract } from "./core/contract-interactions/get-contract";
import { updatePrices } from "./core/contract-interactions/update-prices";

setConfigProvider(fileSystemConfigProvider);
const relayerConfig = config();

const configToShow = Object.assign({}, relayerConfig);
console.log(
  `Starting contract prices updater with relayer config ${JSON.stringify(
    Reflect.deleteProperty(configToShow, "privateKey")
  )}`
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

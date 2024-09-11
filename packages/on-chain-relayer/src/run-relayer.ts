import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { fileSystemConfigProvider } from "./FilesystemConfigProvider";
import {
  config,
  setConfigProvider,
  timelyOverrideSinceLastUpdate,
} from "./config";
import { runIteration } from "./run-iteration";

setConfigProvider(fileSystemConfigProvider);
const relayerConfig = config();

const logger = loggerFactory("relayer/run");

logger.log(
  `Starting ${relayerConfig.adapterContractType} contract prices updater with relayer config ${JSON.stringify(
    {
      ...relayerConfig,
      privateKey: "********",
    }
  )}`
);

if (relayerConfig.temporaryUpdatePriceInterval !== -1) {
  timelyOverrideSinceLastUpdate(relayerConfig.temporaryUpdatePriceInterval);
}

const task = new AsyncTask("Relayer task", runIteration, (error) =>
  logger.log(
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

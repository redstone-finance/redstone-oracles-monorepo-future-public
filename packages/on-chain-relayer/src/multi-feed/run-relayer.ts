import {
  loggerFactory,
  RedstoneCommon,
  sendHealthcheckPing,
} from "@redstone-finance/utils";
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { readManifestAndEnv } from "../FilesystemConfigProvider";
import { MultiFeedOnChainRelayerManifest } from "../types";
import { getIterationArgs } from "./args/get-iteration-args";
import { config, setConfigProvider } from "./config";
import { getAdapterContract } from "./contract-interactions/get-adapter-contract";
import { updateBlockTag } from "./contract-interactions/get-block-tag";
import { updatePrices } from "./contract-interactions/update-prices";
import { makeConfigProvider } from "./make-config-provider";

setConfigProvider(() => {
  const { manifest, env } = readManifestAndEnv();

  return makeConfigProvider(manifest as MultiFeedOnChainRelayerManifest, env);
});
const relayerConfig = config();
const logger = loggerFactory("relayer/run");

logger.log(
  `Starting contract prices updater with relayer config ${JSON.stringify({
    ...relayerConfig,
    privateKey: "********",
  })}`
);

const runIteration = async () => {
  const iterationStart = performance.now();
  const adapterContract = getAdapterContract();
  await updateBlockTag(adapterContract);

  const { shouldUpdatePrices, args, message } =
    await getIterationArgs(adapterContract);
  const { blockTag, dataFeedsToUpdate, fetchDataPackages } = args;

  void sendHealthcheckPing(relayerConfig.healthcheckPingUrl);
  logger.log(
    `Update condition ${
      shouldUpdatePrices ? "" : "NOT "
    }satisfied: ${message} block_number=${blockTag} iteration_duration=${performance.now() - iterationStart}`
  );

  logger.log("Data feeds to be updated:", dataFeedsToUpdate);

  if (shouldUpdatePrices) {
    // TODO: strategy to add feeds that dont require update yet

    await updatePrices(
      adapterContract,
      blockTag,
      dataFeedsToUpdate,
      fetchDataPackages
    );
  }
};

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

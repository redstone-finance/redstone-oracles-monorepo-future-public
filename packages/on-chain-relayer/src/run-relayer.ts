import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { ValuesForDataFeeds, requestDataPackages } from "redstone-sdk";
import { shouldUpdate } from "./core/update-conditions/should-update";
import { updatePrices } from "./core/contract-interactions/update-prices";
import { getLastRoundParamsFromContract } from "./core/contract-interactions/get-last-round-params";
import { getAdapterContract } from "./core/contract-interactions/get-contract";
import { getValuesForDataFeeds } from "./core/contract-interactions/get-values-for-data-feeds";
import { sendHealthcheckPing } from "./core/monitoring/send-healthcheck-ping";
import { config, setConfigProvider } from "./config";
import { fileSystemConfigProvider } from "./FilesystemConfigProvider";

setConfigProvider(fileSystemConfigProvider);
const relayerConfig = config();

console.log(
  `Starting contract prices updater with interval ${relayerConfig.relayerIterationInterval}`
);

const runIteration = async () => {
  const { dataServiceId, uniqueSignersCount, dataFeeds, updateConditions } = relayerConfig;
  const adapterContract = getAdapterContract();

  await sendHealthcheckPing();

  const { lastUpdateTimestamp } = await getLastRoundParamsFromContract(
    adapterContract
  );

  // We fetch latest values from contract only if we want to check value deviation
  let valuesFromContract: ValuesForDataFeeds = {};
  if (updateConditions.includes("value-deviation")) {
    valuesFromContract = await getValuesForDataFeeds(
      adapterContract,
      dataFeeds
    );
  }

  const dataPackages = await requestDataPackages({
    dataServiceId,
    uniqueSignersCount,
    dataFeeds,
    valuesToCompare: valuesFromContract,
  });

  const { shouldUpdatePrices } = shouldUpdate({
    dataPackages,
    valuesFromContract,
    lastUpdateTimestamp,
  }, relayerConfig);

  if (!shouldUpdatePrices) {
  } else {
    await updatePrices(dataPackages, adapterContract, lastUpdateTimestamp);
  }
};

const task = new AsyncTask(
  "Relayer task",
  () => runIteration(),
  (error) => console.log(error.stack)
);

const job = new SimpleIntervalJob(
  { milliseconds: relayerConfig.relayerIterationInterval, runImmediately: true },
  task,
  { preventOverrun: true }
);

const scheduler = new ToadScheduler();

scheduler.addSimpleIntervalJob(job);

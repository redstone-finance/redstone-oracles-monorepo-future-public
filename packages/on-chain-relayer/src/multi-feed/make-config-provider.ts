import {
  ConditionCheckNames,
  MultiFeedOnChainRelayerManifest,
  OnChainRelayerEnv,
  UpdateTriggers,
} from "../types";
import { RelayerConfig } from "./types";

export const MS_IN_ONE_MINUTE = 60000;

export const makeConfigProvider = (
  manifest: MultiFeedOnChainRelayerManifest,
  env: OnChainRelayerEnv
): RelayerConfig => {
  const updateConditions: Record<string, ConditionCheckNames[]> = {};
  const updateTriggers: Record<string, UpdateTriggers> = {};

  for (const [
    dataFeedId,
    { updateTriggersOverrides: dataFeedUpdateTriggers },
  ] of Object.entries(manifest.priceFeeds)) {
    updateConditions[dataFeedId] = [];
    updateTriggers[dataFeedId] = {};

    const deviationPercentage =
      dataFeedUpdateTriggers?.deviationPercentage ??
      manifest.updateTriggers.deviationPercentage;

    const timeSinceLastUpdateInMilliseconds =
      dataFeedUpdateTriggers?.timeSinceLastUpdateInMilliseconds ??
      manifest.updateTriggers.timeSinceLastUpdateInMilliseconds;

    const cron = dataFeedUpdateTriggers?.cron ?? manifest.updateTriggers.cron;

    if (deviationPercentage) {
      updateConditions[dataFeedId].push("value-deviation");
      updateTriggers[dataFeedId].deviationPercentage = deviationPercentage;
    }

    if (timeSinceLastUpdateInMilliseconds) {
      updateConditions[dataFeedId].push("time");
      updateTriggers[dataFeedId].timeSinceLastUpdateInMilliseconds =
        timeSinceLastUpdateInMilliseconds;
    }

    if (cron && cron.length > 0) {
      updateConditions[dataFeedId].push("cron");
      updateTriggers[dataFeedId].cron = cron;
    }
  }

  return {
    chainName: manifest.chain.name,
    chainId: manifest.chain.id,
    adapterContractAddress: manifest.adapterContract,
    dataServiceId: manifest.dataServiceId,
    dataFeeds: Object.keys(manifest.priceFeeds),
    updateTriggers,
    updateConditions,
    dataPackagesNames: manifest.dataPacakgesNames,
    adapterContractType: manifest.adapterContractType,
    fallbackOffsetInMS: env.fallbackOffsetInMinutes * MS_IN_ONE_MINUTE,
    ...env,
  };
};

import {
  AnyOnChainRelayerManifest,
  isMultiFeedRelayerManifest,
  MultiFeedOnChainRelayerManifest,
  OnChainRelayerManifest,
  UpdateTriggers,
} from "@redstone-finance/on-chain-relayer-common";
import {
  ConditionCheckNames,
  ManifestConfig,
  OnChainRelayerEnv,
  RelayerConfig,
} from "./RelayerConfig";

const createManifestConfig = (
  manifest: AnyOnChainRelayerManifest
): ManifestConfig => {
  const { updateConditions, updateTriggers } = makeUpdateConditions(manifest);
  return {
    chainName: manifest.chain.name,
    chainId: manifest.chain.id,
    adapterContractAddress: manifest.adapterContract,
    dataServiceId: manifest.dataServiceId,
    dataFeeds: Object.keys(manifest.priceFeeds),
    dataPackagesNames: manifest.dataPacakgesNames,
    updateConditions,
    updateTriggers,
    adapterContractType: manifest.adapterContractType,
  };
};

export const makeRelayerConfig = (
  manifest: AnyOnChainRelayerManifest,
  env: OnChainRelayerEnv
): RelayerConfig => {
  return {
    ...createManifestConfig(manifest),
    ...env,
  };
};

export const makeUpdateConditions = (
  manifest: AnyOnChainRelayerManifest
): {
  updateConditions: Record<string, ConditionCheckNames[]>;
  updateTriggers: Record<string, UpdateTriggers>;
} => {
  return isMultiFeedRelayerManifest(manifest)
    ? makeMultiFeedUpdateConditions(manifest)
    : makePriceFeedsUpdateConditions(manifest);
};

export const makePriceFeedsUpdateConditions = (
  manifest: OnChainRelayerManifest
): {
  updateConditions: Record<string, ConditionCheckNames[]>;
  updateTriggers: Record<string, UpdateTriggers>;
} => {
  const updateConditions: Record<string, ConditionCheckNames[]> = {};
  const updateTriggers: Record<string, UpdateTriggers> = {};
  const {
    timeSinceLastUpdateInMilliseconds,
    deviationPercentage,
    cron,
    priceFeedsDeviationOverrides,
  } = manifest.updateTriggers;
  const dataFeeds = Object.keys(manifest.priceFeeds);

  for (const dataFeedId of dataFeeds) {
    updateConditions[dataFeedId] = [];
    updateTriggers[dataFeedId] = {};

    if (deviationPercentage) {
      updateConditions[dataFeedId].push("value-deviation");
      updateTriggers[dataFeedId].deviationPercentage =
        priceFeedsDeviationOverrides?.[dataFeedId] ?? deviationPercentage;
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
    updateConditions,
    updateTriggers,
  };
};

export const makeMultiFeedUpdateConditions = (
  manifest: MultiFeedOnChainRelayerManifest
): {
  updateConditions: Record<string, ConditionCheckNames[]>;
  updateTriggers: Record<string, UpdateTriggers>;
} => {
  const updateConditions: Record<string, ConditionCheckNames[]> = {};
  const updateTriggers: Record<string, UpdateTriggers> = {};

  for (const [
    dataFeedId,
    { updateTriggersOverrides: dataFeedUpdateTriggers },
  ] of Object.entries(manifest.priceFeeds)) {
    updateConditions[dataFeedId] = [];
    updateTriggers[dataFeedId] = {};

    const deviationPercentage = dataFeedUpdateTriggers
      ? dataFeedUpdateTriggers.deviationPercentage
      : manifest.updateTriggers.deviationPercentage;

    const timeSinceLastUpdateInMilliseconds = dataFeedUpdateTriggers
      ? dataFeedUpdateTriggers.timeSinceLastUpdateInMilliseconds
      : manifest.updateTriggers.timeSinceLastUpdateInMilliseconds;

    const cron = dataFeedUpdateTriggers
      ? dataFeedUpdateTriggers.cron
      : manifest.updateTriggers.cron;

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
    updateConditions,
    updateTriggers,
  };
};

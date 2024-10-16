import {
  AnyOnChainRelayerManifest,
  MultiFeedOnChainRelayerManifest,
  OnChainRelayerManifest,
  UpdateTriggers,
} from "@redstone-finance/on-chain-relayer-common";
import {
  ConditionCheckNames,
  OnChainRelayerEnv,
  RelayerConfig,
  type ManifestConfig,
} from "./types";

export const MS_IN_ONE_MINUTE = 60000;

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

export const makeConfigProvider = (
  manifest: AnyOnChainRelayerManifest,
  env: OnChainRelayerEnv
): RelayerConfig => {
  return {
    fallbackOffsetInMS: env.fallbackOffsetInMinutes * MS_IN_ONE_MINUTE,
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
  switch (manifest.adapterContractType) {
    case "price-feeds":
    case "mento":
    case "fuel":
      return makePriceFeedsUpdateConditions(manifest);
    case "multi-feed":
      return makeMultiFeedUpdateConditions(manifest);
    default:
      throw new Error(`Unsupported adapter contract type`);
  }
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

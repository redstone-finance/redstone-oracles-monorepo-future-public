import {
  AnyOnChainRelayerManifest,
  ConditionCheckNames,
  OnChainRelayerEnv,
  RelayerConfig,
} from "./types";

export const MS_IN_ONE_MINUTE = 60000;

export const makeConfigProvider = (
  manifest: AnyOnChainRelayerManifest,
  env: OnChainRelayerEnv
): RelayerConfig => {
  const {
    timeSinceLastUpdateInMilliseconds,
    deviationPercentage,
    cron,
    priceFeedsDeviationOverrides,
  } = manifest.updateTriggers;
  const updateConditions = [] as ConditionCheckNames[];

  if (deviationPercentage) {
    updateConditions.push("value-deviation");
  }

  if (timeSinceLastUpdateInMilliseconds) {
    updateConditions.push("time");
  }

  if (cron && cron.length > 0) {
    updateConditions.push("cron");
  }

  return {
    updatePriceInterval: timeSinceLastUpdateInMilliseconds,
    cronExpressions: cron,
    chainName: manifest.chain.name,
    chainId: manifest.chain.id,
    adapterContractAddress: manifest.adapterContract,
    dataServiceId: manifest.dataServiceId,
    dataFeeds: Object.keys(manifest.priceFeeds),
    dataPackagesNames: manifest.dataPacakgesNames,
    updateConditions,
    minDeviationPercentage: deviationPercentage,
    priceFeedsDeviationOverrides,
    adapterContractType: manifest.adapterContractType,
    fallbackOffsetInMS: env.fallbackOffsetInMinutes * MS_IN_ONE_MINUTE,
    ...env,
  };
};

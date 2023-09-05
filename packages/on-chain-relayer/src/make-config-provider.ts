import {
  ConditionCheckNames,
  OnChainRelayerEnv,
  OnChainRelayerManifest,
  RelayerConfig,
} from "./types";

const DEFAULT_ADAPTER_CONTRACT_TYPE = "price-feeds";
export const MS_IN_ONE_MINUTE = 60000;

export const makeConfigProvider = (
  manifest: OnChainRelayerManifest,
  env: OnChainRelayerEnv
): RelayerConfig => {
  const { timeSinceLastUpdateInMilliseconds, deviationPercentage, cron } =
    manifest.updateTriggers;
  let updateConditions = [] as ConditionCheckNames[];

  if (deviationPercentage) {
    updateConditions.push("value-deviation");
  }

  if (timeSinceLastUpdateInMilliseconds) {
    updateConditions.push("time");
  }

  if (cron && cron.length > 0) {
    updateConditions.push("cron");
  }

  return Object.freeze({
    updatePriceInterval: timeSinceLastUpdateInMilliseconds,
    cronExpression: cron,
    chainName: manifest.chain.name!,
    chainId: manifest.chain.id,
    adapterContractAddress: manifest.adapterContract,
    dataServiceId: manifest.dataServiceId,
    dataFeeds: Object.keys(manifest.priceFeeds),
    updateConditions: updateConditions,
    minDeviationPercentage: deviationPercentage,
    adapterContractType:
      manifest.adapterContractType ?? DEFAULT_ADAPTER_CONTRACT_TYPE,
    fallbackOffsetInMS: env.fallbackOffsetInMinutes * MS_IN_ONE_MINUTE,
    ...env,
  });
};

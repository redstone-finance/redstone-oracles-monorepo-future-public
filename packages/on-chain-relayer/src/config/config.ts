import { AdapterTypesEnum } from "@redstone-finance/on-chain-relayer-common";
import { makeRelayerConfig } from "./make-relayer-config";
import { readManifestAndEnv } from "./read-manifest-and-env";

export const ConsciouslyInvoked = Symbol("ConsciouslyInvoked");

export const config = (isInvokedConsciously?: typeof ConsciouslyInvoked) => {
  if (isInvokedConsciously !== ConsciouslyInvoked) {
    throw new Error(
      "config() function must be invoked consciously from the relayer running function"
    );
  }

  const { manifest, env } = readManifestAndEnv();
  const relayerConfig = makeRelayerConfig(manifest, env);

  try {
    AdapterTypesEnum.parse(relayerConfig.adapterContractType);
  } catch {
    throw new Error(
      `Adapter contract type not supported: ${relayerConfig.adapterContractType}`
    );
  }
  return relayerConfig;
};

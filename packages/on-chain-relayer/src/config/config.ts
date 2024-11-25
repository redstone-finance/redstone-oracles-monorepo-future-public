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

  // Validating adapter contract type
  if (
    !["mento", "price-feeds", "multi-feed", "fuel"].includes(
      relayerConfig.adapterContractType
    )
  ) {
    throw new Error(
      `Adapter contract type not supported: ${relayerConfig.adapterContractType}`
    );
  }

  return relayerConfig;
};

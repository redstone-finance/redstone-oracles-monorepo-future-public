import { ConfigProvider, RelayerConfig } from "./types";

let configProvider: ConfigProvider | undefined = undefined;
let relayerConfig: RelayerConfig | undefined = undefined;

export const config = () => {
  if (relayerConfig) {
    return relayerConfig;
  }
  if (!configProvider) {
    throw new Error(
      "Config provider not defined. Consider calling setConfigProvider method."
    );
  }
  relayerConfig = configProvider();

  // Validating adapter contract type
  if (!["mento", "price-feeds"].includes(relayerConfig.adapterContractType)) {
    throw new Error(
      `Adapter contract type not supported: ${relayerConfig.adapterContractType}`
    );
  }

  // Preventing unsupported update condition for mento adapter type
  if (
    relayerConfig.adapterContractType === "mento" &&
    relayerConfig.updateConditions.includes("value-deviation")
  ) {
    throw new Error(
      "Mento adapter does not support the value-deviation update condition"
    );
  }
  return relayerConfig;
};

export const setConfigProvider = (provider: ConfigProvider) => {
  relayerConfig = undefined;
  configProvider = provider;
};

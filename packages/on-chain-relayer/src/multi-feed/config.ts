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

  return relayerConfig;
};

export const setConfigProvider = (provider: ConfigProvider) => {
  relayerConfig = undefined;
  configProvider = provider;
};

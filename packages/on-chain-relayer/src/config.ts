import { RedstoneCommon } from "@redstone-finance/utils";
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

  return relayerConfig;
};

export const setConfigProvider = (provider: ConfigProvider) => {
  relayerConfig = undefined;
  configProvider = provider;
};

export const timelyOverrideSinceLastUpdate = (
  temporaryUpdatePriceInterval: number
) => {
  RedstoneCommon.assert(
    relayerConfig,
    "[BUG] It should never happen. Fix code..."
  );
  const oldUpdatePriceInterval = relayerConfig.updatePriceInterval;
  relayerConfig.updatePriceInterval = temporaryUpdatePriceInterval;

  const oldConditions = [...relayerConfig.updateConditions];
  if (!relayerConfig.updateConditions.includes("time")) {
    relayerConfig.updateConditions.push("time");
  }

  const temporaryUpdateDuration = Math.floor(
    temporaryUpdatePriceInterval * 1.5
  );
  console.log(
    `Timely overriding updatePriceInterval to ${RedstoneCommon.msToMin(
      temporaryUpdatePriceInterval
    ).toFixed(2)} [min] for ${RedstoneCommon.msToMin(
      temporaryUpdateDuration
    ).toFixed(2)} [min]`
  );

  setTimeout(() => {
    relayerConfig!.updatePriceInterval = oldUpdatePriceInterval;
    relayerConfig!.updateConditions = oldConditions;
    console.log(
      `Reverting updatePriceInterval to ${oldUpdatePriceInterval} [min]`
    );
  }, temporaryUpdateDuration);
};

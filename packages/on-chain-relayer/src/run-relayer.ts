import { loggerFactory } from "@redstone-finance/utils";
import { fileSystemConfigProvider } from "./FilesystemConfigProvider";
import {
  config,
  setConfigProvider,
  timelyOverrideSinceLastUpdate,
} from "./config";
import { AsyncTaskRunner } from "./runner/AsyncTaskRunner";
import { MqttRunner } from "./runner/MqttRunner";

export const runRelayer = () => {
  setConfigProvider(fileSystemConfigProvider);
  const relayerConfig = config();

  const logger = loggerFactory("relayer/run");

  logger.log(
    `Starting ${relayerConfig.adapterContractType} contract prices updater with relayer config ${JSON.stringify(
      {
        ...relayerConfig,
        privateKey: "********",
      }
    )}`
  );

  if (relayerConfig.temporaryUpdatePriceInterval !== -1) {
    timelyOverrideSinceLastUpdate(relayerConfig.temporaryUpdatePriceInterval);
  }

  if (relayerConfig.runWithMqtt) {
    void MqttRunner.run(relayerConfig);
  } else {
    AsyncTaskRunner.run(relayerConfig, logger);
  }
};

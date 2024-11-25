import { loggerFactory } from "@redstone-finance/utils";
import { config, ConsciouslyInvoked } from "./config/config";
import { timelyOverrideSinceLastUpdate } from "./config/timely-override-since-last-update";
import { AsyncTaskRunner } from "./runner/AsyncTaskRunner";
import { MqttRunner } from "./runner/MqttRunner";

export const runRelayer = () => {
  const relayerConfig = config(ConsciouslyInvoked);

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
    timelyOverrideSinceLastUpdate(
      relayerConfig,
      relayerConfig.temporaryUpdatePriceInterval
    );
  }

  if (relayerConfig.runWithMqtt) {
    void MqttRunner.run(relayerConfig);
  } else {
    AsyncTaskRunner.run(relayerConfig, logger);
  }
};

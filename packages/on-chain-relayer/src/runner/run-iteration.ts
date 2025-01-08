import { loggerFactory, sendHealthcheckPing } from "@redstone-finance/utils";
import _ from "lodash";
import { RelayerConfig } from "../config/RelayerConfig";
import { ContractFacade } from "../facade/ContractFacade";
import { getIterationArgsProvider } from "../facade/get-iteration-args-provider";

export type IterationLogger = {
  log(message: string, ...args: unknown[]): void;
};

export const runIteration = async (
  contractFacade: ContractFacade,
  relayerConfig: RelayerConfig,
  logger: IterationLogger = loggerFactory("relayer/run-iteration"),
  iterationArgsProvider = getIterationArgsProvider(relayerConfig),
  sendHealthcheckPingCallback = sendHealthcheckPing
) => {
  const iterationStart = performance.now();
  const shouldUpdateContext =
    await contractFacade.getShouldUpdateContext(relayerConfig);
  const iterationArgs = await iterationArgsProvider(
    shouldUpdateContext,
    relayerConfig
  );
  void sendHealthcheckPingCallback(relayerConfig.healthcheckPingUrl);
  const messages = _.map(iterationArgs.messages, "message");
  const message = `Update condition ${
    iterationArgs.shouldUpdatePrices ? "" : "NOT "
  }satisfied; block_number=${
    iterationArgs.args.blockTag
  } iteration_duration=${performance.now() - iterationStart}`;

  logger.log(message, messages);

  if (iterationArgs.shouldUpdatePrices) {
    iterationArgs.additionalUpdateMessages?.forEach(({ message, args }) =>
      logger.log(message, args)
    );

    await contractFacade.updatePrices(iterationArgs.args);
  }

  return iterationArgs.shouldUpdatePrices;
};

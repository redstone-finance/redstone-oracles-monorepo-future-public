import { loggerFactory, sendHealthcheckPing } from "@redstone-finance/utils";
import { config } from "./config";
import { ContractFacade } from "./facade/ContractFacade";

export type IterationLogger = {
  log(message: string, ...args: unknown[]): void;
};

export const runIteration = async (
  contractFacade: ContractFacade,
  logger: IterationLogger = loggerFactory("relayer/run-iteration"),
  sendHealthcheckPingCallback = sendHealthcheckPing
) => {
  const iterationStart = performance.now();
  const relayerConfig = config();
  const shouldUpdateContext =
    await contractFacade.getShouldUpdateContext(relayerConfig);
  const iterationArgs = await contractFacade.getIterationArgs(
    shouldUpdateContext,
    relayerConfig
  );
  void sendHealthcheckPingCallback(relayerConfig.healthcheckPingUrl);
  const messages = iterationArgs.messages.map(({ message }) => message),
    message = `Update condition ${
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

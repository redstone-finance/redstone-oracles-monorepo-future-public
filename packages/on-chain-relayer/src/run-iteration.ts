import { loggerFactory, sendHealthcheckPing } from "@redstone-finance/utils";
import { config } from "./config";
import { ContractFacade } from "./facade/ContractFacade";

const logger = loggerFactory("relayer/run-iteration");

export const runIteration = async (contractFacade: ContractFacade) => {
  const iterationStart = performance.now();
  const relayerConfig = config();
  const shouldUpdateContext =
    await contractFacade.getShouldUpdateContext(relayerConfig);
  const iterationArgs = await contractFacade.getIterationArgs(
    shouldUpdateContext,
    relayerConfig
  );
  void sendHealthcheckPing(relayerConfig.healthcheckPingUrl);
  logger.log(
    `Update condition ${
      iterationArgs.shouldUpdatePrices ? "" : "NOT "
    }satisfied: ${iterationArgs.message} block_number=${
      iterationArgs.args.blockTag
    } iteration_duration=${performance.now() - iterationStart}`
  );
  if (iterationArgs.shouldUpdatePrices) {
    iterationArgs.additionalMessages?.forEach(({ message, args }) =>
      logger.log(message, args)
    );

    await contractFacade.updatePrices(iterationArgs.args);
  }
};

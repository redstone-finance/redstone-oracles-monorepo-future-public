import { loggerFactory, sendHealthcheckPing } from "@redstone-finance/utils";
import { config } from "./config";
import { getContractFacade } from "./facade/get-contract-facade";

const logger = loggerFactory("relayer/run-iteration");

export const runIteration = async () => {
  const iterationStart = performance.now();
  const relayerConfig = config();
  const contractFacade = await getContractFacade(relayerConfig);
  const iterationArgs = await contractFacade.getIterationArgs();
  void sendHealthcheckPing(relayerConfig.healthcheckPingUrl);
  logger.log(
    `Update condition ${
      iterationArgs.shouldUpdatePrices ? "" : "NOT "
    }satisfied: ${iterationArgs.message} block_number=${
      iterationArgs.args.blockTag
    } iteration_duration=${performance.now() - iterationStart}`
  );
  if (iterationArgs.shouldUpdatePrices) {
    const logMessages =
      contractFacade.addExtraFeedsToUpdateParams(iterationArgs);
    logMessages.forEach(({ message, args }) => logger.log(message, args));

    await contractFacade.updatePrices(iterationArgs.args);
  }
};

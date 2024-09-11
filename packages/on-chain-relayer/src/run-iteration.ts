import { loggerFactory, sendHealthcheckPing } from "@redstone-finance/utils";
import {
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
} from "../typechain-types";
import { config } from "./config";
import { getAdapterContract } from "./core/contract-interactions/get-adapter-contract";
import { updatePrices } from "./core/contract-interactions/update-prices";
import { getIterationArgs as getMultiFeedIterationArgs } from "./multi-feed/args/get-iteration-args";
import { addExtraFeedsToUpdateParams } from "./multi-feed/gas-optimazation/add-extra-feeds";
import { getIterationArgs as getPriceFeedsIterationArgs } from "./price-feeds/args/get-iteration-args";
import { UpdatePricesArgs } from "./types";

const logger = loggerFactory("relayer/run-iteration");

export const runIteration = async () => {
  const iterationStart = performance.now();
  const relayerConfig = config();
  const adapterContract = getAdapterContract();
  const iterationArgs =
    relayerConfig.adapterContractType === "multi-feed"
      ? await getMultiFeedIterationArgs(
          adapterContract as MultiFeedAdapterWithoutRounds
        )
      : await getPriceFeedsIterationArgs(
          adapterContract as RedstoneAdapterBase
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
    if (relayerConfig.adapterContractType === "multi-feed") {
      logger.log(
        "Data feeds that require update:",
        (iterationArgs.args as UpdatePricesArgs<MultiFeedAdapterWithoutRounds>)
          .dataFeedsToUpdate
      );
      const message = addExtraFeedsToUpdateParams(
        iterationArgs.args as UpdatePricesArgs<MultiFeedAdapterWithoutRounds>
      );
      logger.log(message);
      logger.log(
        "Data feeds to be updated:",
        (iterationArgs.args as UpdatePricesArgs<MultiFeedAdapterWithoutRounds>)
          .dataFeedsToUpdate
      );
    }

    await updatePrices(iterationArgs.args);
  }
};

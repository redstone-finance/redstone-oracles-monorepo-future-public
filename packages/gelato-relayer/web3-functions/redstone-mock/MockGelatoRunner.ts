import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import {
  IRedstoneContractAdapter,
  IterationArgsProvider,
  RelayerConfig,
  runIteration,
} from "@redstone-finance/on-chain-relayer";
import {
  DataPackagesRequestParams,
  IContractConnector,
  IExtendedPricesContractAdapter,
} from "@redstone-finance/sdk";
import { GelatoLogger } from "../redstone/GelatoLogger";
import { GelatoRunner } from "../redstone/GelatoRunner";
import { MockContractFacade } from "./MockContractFacade";

export class MockGelatoRunner extends GelatoRunner {
  override runIteration(
    connector: IContractConnector<
      IExtendedPricesContractAdapter | IRedstoneContractAdapter
    >,
    config: RelayerConfig,
    logger: GelatoLogger
  ) {
    return runIteration(
      new MockContractFacade(connector),
      config,
      logger,
      getIterationArgsProviderFromContext(this.context)
    );
  }
}

function getIterationArgsProviderFromContext(
  context: Web3FunctionContext
): IterationArgsProvider {
  return () => {
    return Promise.resolve({
      shouldUpdatePrices: context.userArgs.shouldUpdatePrices as boolean,
      args: {
        blockTag: 12221,
        updateRequestParams: {} as DataPackagesRequestParams,
        dataFeedsToUpdate: ["ETH"],
        heartbeatUpdates: [1],
        dataFeedsDeviationRatios: { ETH: 1 },
      },
      messages: [{ message: context.userArgs.message as string }],
    });
  };
}

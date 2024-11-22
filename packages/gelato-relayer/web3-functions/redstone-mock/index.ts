import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { IRedstoneContractAdapter } from "@redstone-finance/on-chain-relayer";
import { IContractConnector } from "@redstone-finance/sdk";
import { GelatoRunner } from "../redstone/GelatoRunner";
import { MockContractFacade } from "./MockContractFacade";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;
  const provider = multiChainProvider.default();

  return await new GelatoRunner(
    context,
    (connector: IContractConnector<IRedstoneContractAdapter>) =>
      new MockContractFacade(connector, context)
  ).run(provider);
});

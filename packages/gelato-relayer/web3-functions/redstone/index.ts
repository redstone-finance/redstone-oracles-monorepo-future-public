import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { GelatoRunner } from "./GelatoRunner";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;
  const provider = multiChainProvider.default();

  return await new GelatoRunner(context).run(provider);
});

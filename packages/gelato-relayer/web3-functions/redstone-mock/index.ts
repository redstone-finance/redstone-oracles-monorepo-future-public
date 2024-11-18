import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { MockIterationArgsProcessor } from "./MockIterationArgsProvider";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;
  const provider = multiChainProvider.default();

  return await new MockIterationArgsProcessor(context).processArgs(provider);
});

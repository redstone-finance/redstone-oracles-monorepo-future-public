import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { IterationArgsProvider } from "./IterationArgsProvider";
import { IterationArgsProcessor } from "./IterationArgsProcessor";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;
  const provider = multiChainProvider.default();
  const iterationArgsProvider = new IterationArgsProvider();

  return await new IterationArgsProcessor(
    context,
    iterationArgsProvider
  ).processArgs(provider);
});

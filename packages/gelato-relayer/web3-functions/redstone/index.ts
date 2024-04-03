import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { IterationArgsProcessor } from "./IterationArgsProcessor";
import { IterationArgsProvider } from "./IterationArgsProvider";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;
  const provider = multiChainProvider.default();
  const iterationArgsProvider = new IterationArgsProvider();

  return await new IterationArgsProcessor(
    context,
    iterationArgsProvider
  ).processArgs(provider);
});

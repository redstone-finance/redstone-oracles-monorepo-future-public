import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { IterationArgsProcessor } from "./IterationArgsProcessor";
import { makeIterationArgsProvider } from "./make-iteration-args-provider";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;
  const provider = multiChainProvider.default();

  return await new IterationArgsProcessor(
    context,
    makeIterationArgsProvider
  ).processArgs(provider);
});

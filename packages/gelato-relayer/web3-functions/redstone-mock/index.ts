import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { IterationArgsProcessor } from "../redstone/IterationArgsProcessor";
import { MockIterationArgsProvider } from "./MockIterationArgsProvider";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider } = context;
  const provider = multiChainProvider.default();
  const iterationArgsProvider = new MockIterationArgsProvider(
    context.userArgs.adapterContractAddress as string
  );

  return await new IterationArgsProcessor(context, () =>
    Promise.resolve(iterationArgsProvider)
  ).processArgs(provider);
});

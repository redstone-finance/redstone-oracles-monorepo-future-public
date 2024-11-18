import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { providers } from "ethers";
import { IterationArgsProcessor } from "../redstone/IterationArgsProcessor";

export class MockIterationArgsProcessor extends IterationArgsProcessor {
  constructor(context: Web3FunctionContext) {
    super(context);
  }

  override async processArgs(_provider: providers.StaticJsonRpcProvider) {
    const { shouldUpdatePrices, message, args, adapterContractAddress } =
      this.context.userArgs;

    const resultShouldUpdatePrices = shouldUpdatePrices as boolean;
    const resultMessage =
      message === "undefined" ? undefined : (message as string);
    const resultArgs = args === "undefined" ? undefined : (args as string);

    const updatePricesArgs = {
      shouldUpdatePrices: resultShouldUpdatePrices,
      message: resultMessage,
      args: resultArgs,
    };

    return await IterationArgsProcessor.processIterationArgs(
      updatePricesArgs,
      () =>
        Promise.resolve({
          to: adapterContractAddress as string,
          data: args as string,
        })
    );
  }
}

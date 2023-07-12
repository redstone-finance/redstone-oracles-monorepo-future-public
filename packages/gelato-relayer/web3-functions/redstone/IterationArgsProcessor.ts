import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Web3FunctionResult } from "@gelatonetwork/web3-functions-sdk/dist/lib/types/Web3FunctionResult";
import { providers } from "ethers";
import {
  IterationArgs,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

export class IterationArgsProcessor<Args> {
  constructor(
    private context: Web3FunctionContext,
    private argsProcessor: IterationArgsProviderInterface<Args>
  ) {}

  async processArgs(
    provider: providers.StaticJsonRpcProvider
  ): Promise<Web3FunctionResult> {
    const iterationArgs = await this.argsProcessor.getArgs(
      this.context.userArgs,
      provider
    );

    if (iterationArgs.shouldUpdatePrices) {
      if (!iterationArgs.args) {
        return this.shouldNotExec(iterationArgs, "Args are empty");
      } else {
        const data = await this.argsProcessor.getTransactionData(
          iterationArgs.args
        );

        if (!!data && data != "0x") {
          return this.canExec(data);
        } else {
          return {
            canExec: false,
            message: `Wrong transaction data: '${data}'`,
          };
        }
      }
    } else {
      return this.shouldNotExec(iterationArgs, "Skipping");
    }
  }

  private async shouldNotExec(
    iterationArgs: IterationArgs<Args>,
    alternativeMessage = "Unknown reason"
  ): Promise<Web3FunctionResult> {
    return {
      canExec: false,
      message: iterationArgs.message || alternativeMessage,
    };
  }

  private async canExec(data: string): Promise<Web3FunctionResult> {
    const { userArgs } = this.context;

    return {
      canExec: true,
      callData: [{ data, to: `${userArgs.adapterContractAddress}` }],
    };
  }
}

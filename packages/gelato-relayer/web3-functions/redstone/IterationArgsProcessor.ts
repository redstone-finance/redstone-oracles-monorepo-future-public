import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Web3FunctionResult } from "@gelatonetwork/web3-functions-sdk/dist/lib/types/Web3FunctionResult";
import { providers } from "ethers";
import {
  IterationArgs,
  IterationArgsProviderEnv,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

export class IterationArgsProcessor<Args> {
  constructor(
    private context: Web3FunctionContext,
    private argsProvider: IterationArgsProviderInterface<Args>
  ) {}

  async processArgs(
    provider: providers.StaticJsonRpcProvider
  ): Promise<Web3FunctionResult> {
    const env = await this.getEnvParams();

    const iterationArgs = await this.argsProvider.getArgs(
      this.context.userArgs,
      env,
      provider
    );

    if (iterationArgs.shouldUpdatePrices) {
      if (!iterationArgs.args) {
        return this.shouldNotExec(iterationArgs, "Args are empty");
      } else {
        const data = await this.argsProvider.getTransactionData(
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

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  private shouldNotExec(
    iterationArgs: IterationArgs<Args>,
    alternativeMessage = "Unknown reason"
  ): Web3FunctionResult {
    const message = iterationArgs.message || alternativeMessage;

    console.log(message); // Do not remove - to have the full message visible as the Gelato web3FunctionLogs log entry.

    return { canExec: false, message };
  }

  private canExec(data: string): Web3FunctionResult {
    if (this.argsProvider.adapterContractAddress) {
      return {
        canExec: true,
        callData: [{ data, to: `${this.argsProvider.adapterContractAddress}` }],
      };
    } else {
      return {
        canExec: false,
        message: "Unknown adapterContractAddress",
      };
    }
  }

  private async getEnvParams() {
    const env: IterationArgsProviderEnv = {
      fallbackOffsetInMinutes: Number.parseInt(
        (await this.context.secrets.get("FALLBACK_OFFSET_IN_MINUTES")) ?? "0"
      ),
      historicalPackagesGateways: JSON.parse(
        (await this.context.secrets.get("HISTORICAL_PACKAGES_GATEWAYS")) ?? "[]"
      ) as string[],
    };

    return env;
  }
}

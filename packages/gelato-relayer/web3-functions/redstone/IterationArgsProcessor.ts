import {
  Web3FunctionContext,
  Web3FunctionResult,
} from "@gelatonetwork/web3-functions-sdk";
import { providers } from "ethers";
import {
  IterationArgsProviderEnv,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

export class IterationArgsProcessor<Args> {
  protected argsProvider!: IterationArgsProviderInterface<Args>;

  constructor(
    private readonly context: Web3FunctionContext,
    private readonly argsProviderFactory: (
      env: IterationArgsProviderEnv
    ) => Promise<IterationArgsProviderInterface<Args>>
  ) {}

  private static shouldNotExec(
    argsMessage?: string,
    alternativeMessage = "Unknown reason"
  ): Web3FunctionResult {
    const message = argsMessage ?? alternativeMessage;

    console.log(message); // Do not remove - to have the full message visible as the Gelato web3FunctionLogs log entry.

    return { canExec: false, message };
  }

  async processArgs(
    provider: providers.StaticJsonRpcProvider
  ): Promise<Web3FunctionResult> {
    const env = await this.getEnvParams();

    this.argsProvider = await this.argsProviderFactory(env);

    const iterationArgs = await this.argsProvider.getArgs(
      this.context.userArgs,
      env,
      provider
    );

    if (iterationArgs.shouldUpdatePrices) {
      if (!iterationArgs.args) {
        return IterationArgsProcessor.shouldNotExec(
          iterationArgs.message,
          "Args are empty"
        );
      } else {
        const data = await this.argsProvider.getTransactionData(
          iterationArgs.args
        );

        if (!!data && data != "0x") {
          return this.canExec(data, iterationArgs.message);
        } else {
          return {
            canExec: false,
            message: `Wrong transaction data: '${data}'`,
          };
        }
      }
    } else {
      return IterationArgsProcessor.shouldNotExec(
        iterationArgs.message,
        "Skipping"
      );
    }
  }

  private canExec(data: string, message?: string): Web3FunctionResult {
    console.log(message); // Do not remove - to have the full message visible as the Gelato web3FunctionLogs log entry.

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
      manifestUrls: JSON.parse(
        (await this.context.secrets.get("MANIFEST_URLS")) ?? "[]"
      ) as string[],
      fallbackOffsetInMinutes: Number.parseInt(
        (await this.context.secrets.get("FALLBACK_OFFSET_IN_MINUTES")) ?? "0"
      ),
      historicalPackagesGateways: JSON.parse(
        (await this.context.secrets.get("HISTORICAL_PACKAGES_GATEWAYS")) ?? "[]"
      ) as string[],
      fallbackSkipDeviationBasedFrequentUpdates: JSON.parse(
        (await this.context.secrets.get(
          "SKIP_TX_SENDING_IF_OFFSET_MINUTES_DID_NOT_PASS"
        )) ?? "true"
      ) as boolean,
    };

    if (!this.context.gelatoArgs.taskId) {
      console.log(
        "Overriding secrets by userArgs variables. That means we're not in the Gelato environment but local."
      );

      env.manifestUrls = this.context.userArgs["manifestUrls"] as string[];
    }

    return env;
  }
}

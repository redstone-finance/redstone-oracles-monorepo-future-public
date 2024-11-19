import {
  Web3FunctionContext,
  Web3FunctionResult,
} from "@gelatonetwork/web3-functions-sdk";
import {
  EvmContractConnector,
  EvmContractFacade,
  getEvmContractAdapter,
  getIterationArgsProvider,
  makeConfigProvider,
  setConfigProvider,
} from "@redstone-finance/on-chain-relayer";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { providers } from "ethers";
import {
  IterationArgs,
  IterationArgsProviderEnv,
} from "../IterationArgsProviderInterface";
import { fetchManifestAndSetUp } from "./make-iteration-args-provider";

export class IterationArgsProcessor {
  constructor(protected readonly context: Web3FunctionContext) {}

  static async processIterationArgs<Args>(
    iterationArgs: IterationArgs<Args>,
    getTransactionData: () => Promise<{ data: string; to: string }>
  ): Promise<Web3FunctionResult> {
    if (iterationArgs.shouldUpdatePrices) {
      if (!iterationArgs.args) {
        return IterationArgsProcessor.shouldNotExec(
          iterationArgs.message,
          "Args are empty"
        );
      } else {
        const txDeliveryCall = await getTransactionData();

        if (!!txDeliveryCall.data && txDeliveryCall.data != "0x") {
          return IterationArgsProcessor.canExec(
            txDeliveryCall,
            iterationArgs.message
          );
        } else {
          return {
            canExec: false,
            message: `Wrong transaction data: '${txDeliveryCall.data}'`,
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

  private static shouldNotExec(
    argsMessage?: string,
    alternativeMessage = "Unknown reason"
  ): Web3FunctionResult {
    const message = argsMessage ?? alternativeMessage;

    console.log(message); // Do not remove - to have the full message visible as the Gelato web3FunctionLogs log entry.

    return { canExec: false, message };
  }

  private static canExec(
    txDeliveryCall: { data: string; to: string },
    message?: string
  ): Web3FunctionResult {
    console.log(message); // Do not remove - to have the full message visible as the Gelato web3FunctionLogs log entry.

    return {
      canExec: true,
      callData: [{ data: txDeliveryCall.data, to: txDeliveryCall.to }],
    };
  }

  async processArgs(
    provider: providers.StaticJsonRpcProvider
  ): Promise<Web3FunctionResult> {
    const env = await this.getEnvParams();
    const { relayerEnv, manifest } = await fetchManifestAndSetUp(env);

    setConfigProvider(() => makeConfigProvider(manifest, relayerEnv));

    const config = makeConfigProvider(manifest, relayerEnv);
    const connector = new EvmContractConnector(
      provider,
      getEvmContractAdapter(config, provider)
    );

    const facade = new EvmContractFacade(
      connector,
      getIterationArgsProvider(config)
    );
    const context = await facade.getShouldUpdateContext(config);
    const iterationArgs = await facade.getIterationArgs(context, config);

    const getTransactionData = async () => {
      const paramsProvider = new ContractParamsProvider(
        iterationArgs.args.updateRequestParams,
        undefined,
        iterationArgs.args.dataFeedsToUpdate
      );

      return await (
        await connector.getAdapter()
      ).makeUpdateTx(paramsProvider, Date.now());
    };

    return await IterationArgsProcessor.processIterationArgs(
      iterationArgs,
      getTransactionData
    );
  }

  private async getEnvParams() {
    const env: IterationArgsProviderEnv = {
      manifestUrls: JSON.parse(
        (await this.context.secrets.get("MANIFEST_URLS")) ?? "[]"
      ) as string[],
      fallbackOffsetInMilliseconds: Number.parseInt(
        (await this.context.secrets.get("FALLBACK_OFFSET_IN_MILLISECONDS")) ??
          "0"
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

import {
  Web3FunctionContext,
  Web3FunctionResult,
} from "@gelatonetwork/web3-functions-sdk";
import {
  ContractFacade,
  EvmContractConnector,
  EvmContractFacade,
  getEvmContractAdapter,
  getIterationArgsProvider,
  IRedstoneContractAdapter,
  IterationArgsProvider,
  makeConfigProvider,
  runIteration,
  setConfigProvider,
} from "@redstone-finance/on-chain-relayer";
import { IContractConnector } from "@redstone-finance/sdk";
import { providers } from "ethers";
import { IterationArgsProviderEnv } from "../IterationArgsProviderInterface";
import { GelatoDeliveryMan } from "./GelatoDeliveryMan";
import { GelatoLogger } from "./GelatoLogger";
import { fetchManifestAndSetUpEnv } from "./fetch-manifest-and-set-up-env";

export class GelatoRunner {
  constructor(
    private readonly context: Web3FunctionContext,
    private facadeCreatorOverride?: (
      connector: IContractConnector<IRedstoneContractAdapter>,
      iterationArgsProvider: IterationArgsProvider
    ) => ContractFacade
  ) {}

  async run(
    provider: providers.StaticJsonRpcProvider
  ): Promise<Web3FunctionResult> {
    const env = await this.getEnvParams();
    const { relayerEnv, manifest } = await fetchManifestAndSetUpEnv(env);
    const config = makeConfigProvider(manifest, relayerEnv);

    setConfigProvider(() => config);

    return await new Promise((resolve, reject) => {
      const logger = new GelatoLogger();
      const deliveryMan = new GelatoDeliveryMan(resolve, logger);
      const connector = new EvmContractConnector(
        provider,
        getEvmContractAdapter(config, provider, deliveryMan)
      );

      const facade = (
        this.facadeCreatorOverride ??
        ((conn, argsProvider) => new EvmContractFacade(conn, argsProvider))
      )(connector, getIterationArgsProvider(config));

      runIteration(facade, logger)
        .then((didUpdate) => {
          if (didUpdate) {
            return;
          }

          deliveryMan.doNotDeliver();
        })
        .catch(reject);
    });
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
        "Overriding secrets by userArgs variables. That means we're not in the Gelato environment but local.",
        this.context.userArgs
      );

      env.manifestUrls = this.context.userArgs["manifestUrls"] as string[];
      const localManifestData = this.context.userArgs[
        "localManifestData"
      ] as string;
      if (localManifestData) {
        env.localManifestData = JSON.parse(atob(localManifestData));
      }
    }

    return env;
  }
}

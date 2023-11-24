import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { Contract, providers } from "ethers";
import {
  getAbiForAdapter,
  getIterationArgs,
  makeConfigProvider,
  OnChainRelayerEnv,
  OnChainRelayerManifest,
  RedstoneAdapterBase,
  setConfigProvider,
  UpdatePricesArgs,
} from "@redstone-finance/on-chain-relayer";
import {
  IterationArgs,
  IterationArgsProviderEnv,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";
import axios from "axios";

const NOT_NEEDED_FOR_GELATO = "Not needed for Gelato";
const NUMBER_NOT_NEEDED_FOR_GELATO = 0;

const EMPTY_GELATO_ENV = {
  relayerIterationInterval: NUMBER_NOT_NEEDED_FOR_GELATO,
  rpcUrls: [NOT_NEEDED_FOR_GELATO],
  privateKey: NOT_NEEDED_FOR_GELATO,
  gasLimit: NUMBER_NOT_NEEDED_FOR_GELATO,
  healthcheckPingUrl: undefined,
  expectedTxDeliveryTimeInMS: NUMBER_NOT_NEEDED_FOR_GELATO,
  singleProviderOperationTimeout: NUMBER_NOT_NEEDED_FOR_GELATO,
  allProvidersOperationTimeout: NUMBER_NOT_NEEDED_FOR_GELATO,
  agreementAcceptableBlocksDiff: NUMBER_NOT_NEEDED_FOR_GELATO,
  isArbitrumNetwork: false,
  gasMultiplier: 1.125,
  isNotLazy: true,
  disableCustomGasOracle: false,
};

export class IterationArgsProvider
  implements IterationArgsProviderInterface<UpdatePricesArgs>
{
  adapterContractAddress?: string;

  async getArgs(
    userArgs: Web3FunctionUserArgs,
    env: IterationArgsProviderEnv,
    provider: providers.StaticJsonRpcProvider
  ): Promise<IterationArgs<UpdatePricesArgs>> {
    await this.fetchManifestAndSetUp(userArgs, env);

    const abi = getAbiForAdapter();

    if (!this.adapterContractAddress) {
      throw new Error("Unknown adapterContractAddress");
    }

    const adapterContract = new Contract(
      this.adapterContractAddress,
      abi,
      provider
    ) as RedstoneAdapterBase;

    return await getIterationArgs(adapterContract);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getTransactionData({
    adapterContract,
    dataPackagesWrapper,
    proposedTimestamp,
  }: UpdatePricesArgs): Promise<string | undefined> {
    const wrappedContract =
      dataPackagesWrapper.overwriteEthersContract(adapterContract);

    const { data } =
      await wrappedContract.populateTransaction.updateDataFeedsValues(
        proposedTimestamp
      );

    return data;
  }

  private async fetchManifestAndSetUp(
    userArgs: Web3FunctionUserArgs,
    env: IterationArgsProviderEnv
  ) {
    const manifest = (
      await axios.get(`${String(userArgs.manifestUrl)}?t=${Date.now()}`)
    ).data as OnChainRelayerManifest | undefined;

    if (!manifest) {
      throw new Error("Manifest fetching error");
    }

    const relayerEnv: OnChainRelayerEnv = {
      ...EMPTY_GELATO_ENV,
      ...env,
    };

    this.adapterContractAddress = manifest.adapterContract;
    setConfigProvider(() => makeConfigProvider(manifest, relayerEnv));
  }
}

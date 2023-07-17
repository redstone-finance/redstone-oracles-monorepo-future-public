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
} from "redstone-on-chain-relayer";
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
  rpcUrl: NOT_NEEDED_FOR_GELATO,
  privateKey: NOT_NEEDED_FOR_GELATO,
  gasLimit: NUMBER_NOT_NEEDED_FOR_GELATO,
  healthcheckPingUrl: undefined,
  expectedTxDeliveryTimeInMS: NUMBER_NOT_NEEDED_FOR_GELATO,
  isArbitrumNetwork: false,
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
      throw "Unknown adapterContractAddress";
    }

    const adapterContract = new Contract(
      this.adapterContractAddress,
      abi,
      provider
    ) as RedstoneAdapterBase;

    return await getIterationArgs(adapterContract);
  }

  async getTransactionData({
    adapterContract,
    wrapContract,
    proposedTimestamp,
  }: UpdatePricesArgs): Promise<string | undefined> {
    const wrappedContract = wrapContract(adapterContract);

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
      await axios.get(`${userArgs.manifestUrl}?t=${Date.now()}`)
    ).data as OnChainRelayerManifest;

    if (!manifest) {
      throw "Manifest fetching error";
    }

    const relayerEnv: OnChainRelayerEnv = {
      ...EMPTY_GELATO_ENV,
      ...env,
    };

    this.adapterContractAddress = manifest.adapterContract;
    setConfigProvider(() => makeConfigProvider(manifest, relayerEnv));
  }
}

import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { Contract, providers } from "ethers";
import {
  getAbiForAdapter,
  getIterationArgs,
  IRedstoneAdapter,
  makeConfigProvider,
  OnChainRelayerEnv,
  OnChainRelayerManifest,
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
    ) as IRedstoneAdapter;

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
      throw "Unknown manifest.";
    }

    const relayerEnv: OnChainRelayerEnv = {
      relayerIterationInterval: NUMBER_NOT_NEEDED_FOR_GELATO,
      rpcUrl: NOT_NEEDED_FOR_GELATO,
      privateKey: NOT_NEEDED_FOR_GELATO,
      uniqueSignersCount: userArgs.uniqueSignersCount as unknown as number,
      gasLimit: NUMBER_NOT_NEEDED_FOR_GELATO,
      healthcheckPingUrl: undefined,
      adapterContractType: userArgs.adapterContractType as unknown as string,
      expectedTxDeliveryTimeInMS: NUMBER_NOT_NEEDED_FOR_GELATO,
      isArbitrumNetwork: false,
      ...env,
    };

    this.adapterContractAddress = manifest.adapterContract;
    setConfigProvider(() => makeConfigProvider(manifest, relayerEnv));
  }
}

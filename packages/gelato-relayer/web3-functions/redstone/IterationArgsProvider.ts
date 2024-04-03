import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import {
  OnChainRelayerEnv,
  OnChainRelayerManifestSchema,
  RedstoneAdapterBase,
  UpdatePricesArgs,
  getAbiForAdapter,
  getIterationArgs,
  makeConfigProvider,
  setConfigProvider,
} from "@redstone-finance/on-chain-relayer";
import axios from "axios";
import { Contract, providers } from "ethers";
import {
  IterationArgs,
  IterationArgsProviderEnv,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

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
  twoDimensionalFees: false,
  gasMultiplier: 1.125,
  isNotLazy: true,
  disableCustomGasOracle: false,
  fallbackSkipDeviationBasedFrequentUpdates: false,
  temporaryUpdatePriceInterval: -1,
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
    await this.fetchManifestAndSetUp(env);

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

  private async fetchManifestAndSetUp(env: IterationArgsProviderEnv) {
    const manifestUrl = `${env.manifestUrl}?t=${Date.now()}`;
    let manifestData: unknown;
    try {
      manifestData = (await axios.get(manifestUrl)).data;
    } catch (e) {
      console.log(`Error fetching manifest from url: ${manifestUrl}`);
      throw e;
    }

    const manifest = OnChainRelayerManifestSchema.parse(manifestData);

    const relayerEnv: OnChainRelayerEnv = {
      ...EMPTY_GELATO_ENV,
      ...env,
    };

    this.adapterContractAddress = manifest.adapterContract;
    setConfigProvider(() => makeConfigProvider(manifest, relayerEnv));
  }
}

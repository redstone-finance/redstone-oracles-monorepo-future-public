import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  getAbiForAdapter,
  getMultiFeedIterationArgs,
  makeConfigProvider,
  MultiFeedAdapterWithoutRounds,
  OnChainRelayerEnv,
  setConfigProvider,
  UpdatePricesArgs,
} from "@redstone-finance/on-chain-relayer";
import type { MultiFeedOnChainRelayerManifest } from "@redstone-finance/on-chain-relayer-common";
import { Contract, providers, utils } from "ethers";
import {
  IterationArgs,
  IterationArgsProviderEnv,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

export class MultiFeedIterationArgsProvider
  implements IterationArgsProviderInterface<UpdatePricesArgs>
{
  constructor(
    protected manifest: MultiFeedOnChainRelayerManifest,
    protected relayerEnv: OnChainRelayerEnv
  ) {}

  adapterContractAddress?: string;

  async getArgs(
    userArgs: Web3FunctionUserArgs,
    env: IterationArgsProviderEnv,
    provider: providers.StaticJsonRpcProvider
  ): Promise<IterationArgs<UpdatePricesArgs>> {
    this.setUp();

    const abi = getAbiForAdapter();

    if (!this.adapterContractAddress) {
      throw new Error("Unknown adapterContractAddress");
    }

    const adapterContract = new Contract(
      this.adapterContractAddress,
      abi,
      provider
    ) as MultiFeedAdapterWithoutRounds;

    return await getMultiFeedIterationArgs(adapterContract);
  }

  async getTransactionData({
    adapterContract,
    dataFeedsToUpdate,
    fetchDataPackages,
  }: UpdatePricesArgs<MultiFeedAdapterWithoutRounds>): Promise<
    string | undefined
  > {
    const dataPackages = await fetchDataPackages();
    const dataPackagesWrapper = new DataPackagesWrapper(dataPackages);
    const dataFeedsAsBytes32 = dataFeedsToUpdate.map(utils.formatBytes32String);

    const wrappedContract =
      dataPackagesWrapper.overwriteEthersContract(adapterContract);

    const { data } =
      await wrappedContract.populateTransaction.updateDataFeedsValuesPartial(
        dataFeedsAsBytes32
      );

    return data;
  }

  private setUp() {
    this.adapterContractAddress = this.manifest.adapterContract;
    setConfigProvider(() => makeConfigProvider(this.manifest, this.relayerEnv));
  }
}

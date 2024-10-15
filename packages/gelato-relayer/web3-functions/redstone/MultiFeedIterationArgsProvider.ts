import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  getAbiForAdapter,
  getMultiFeedIterationArgs,
  makeConfigProvider,
  MultiFeedAdapterWithoutRounds,
  MultiFeedEvmContractFacade,
  MultiFeedUpdatePricesArgs,
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
  adapterContract?: MultiFeedAdapterWithoutRounds;

  async getArgs(
    _userArgs: Web3FunctionUserArgs,
    _env: IterationArgsProviderEnv,
    provider: providers.StaticJsonRpcProvider
  ): Promise<IterationArgs<UpdatePricesArgs>> {
    this.setUp();

    const abi = getAbiForAdapter();

    if (!this.adapterContractAddress) {
      throw new Error("Unknown adapterContractAddress");
    }

    this.adapterContract = new Contract(
      this.adapterContractAddress,
      abi,
      provider
    ) as MultiFeedAdapterWithoutRounds;

    return await getMultiFeedIterationArgs(
      new MultiFeedEvmContractFacade(this.adapterContract)
    );
  }

  async getTransactionData({
    dataFeedsToUpdate,
    fetchDataPackages,
  }: MultiFeedUpdatePricesArgs): Promise<string | undefined> {
    const dataPackages = await fetchDataPackages();
    const dataPackagesWrapper = new DataPackagesWrapper(dataPackages);
    const dataFeedsAsBytes32 = dataFeedsToUpdate.map(utils.formatBytes32String);

    if (!this.adapterContract) {
      throw new Error("Adapter contract not set");
    }

    const wrappedContract = dataPackagesWrapper.overwriteEthersContract(
      this.adapterContract
    );

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

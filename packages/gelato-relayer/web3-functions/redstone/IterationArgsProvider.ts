import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  getAbiForAdapter,
  getPriceFeedsIterationArgs,
  makeConfigProvider,
  OnChainRelayerEnv,
  PriceAdapterEvmContractFacade,
  RedstoneAdapterBase,
  setConfigProvider,
  UpdatePricesArgs,
} from "@redstone-finance/on-chain-relayer";
import type { OnChainRelayerManifest } from "@redstone-finance/on-chain-relayer-common";
import { chooseDataPackagesTimestamp } from "@redstone-finance/sdk";
import { Contract, providers } from "ethers";
import {
  IterationArgs,
  IterationArgsProviderEnv,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

export class IterationArgsProvider
  implements IterationArgsProviderInterface<UpdatePricesArgs>
{
  constructor(
    protected manifest: OnChainRelayerManifest,
    protected relayerEnv: OnChainRelayerEnv
  ) {}

  adapterContractAddress?: string;
  adapterContract?: RedstoneAdapterBase;

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
    ) as RedstoneAdapterBase;

    return await getPriceFeedsIterationArgs(
      new PriceAdapterEvmContractFacade(this.adapterContract)
    );
  }

  async getTransactionData({
    fetchDataPackages,
  }: UpdatePricesArgs): Promise<string | undefined> {
    const dataPackages = await fetchDataPackages();
    const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);
    const dataPackagesWrapper = new DataPackagesWrapper(dataPackages);

    if (!this.adapterContract) {
      throw new Error("Adapter contract not set");
    }

    const wrappedContract = dataPackagesWrapper.overwriteEthersContract(
      this.adapterContract
    );

    const { data } =
      await wrappedContract.populateTransaction.updateDataFeedsValues(
        proposedTimestamp
      );

    return data;
  }

  private setUp() {
    this.adapterContractAddress = this.manifest.adapterContract;
    setConfigProvider(() => makeConfigProvider(this.manifest, this.relayerEnv));
  }
}

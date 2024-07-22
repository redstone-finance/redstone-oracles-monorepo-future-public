import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  chooseDataPackagesTimestamp,
  getAbiForAdapter,
  getPriceFeedsIterationArgs,
  makeConfigProvider,
  OnChainRelayerEnv,
  OnChainRelayerManifest,
  RedstoneAdapterBase,
  setConfigProvider,
  UpdatePricesArgs,
} from "@redstone-finance/on-chain-relayer";
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
    ) as RedstoneAdapterBase;

    return await getPriceFeedsIterationArgs(adapterContract);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getTransactionData({
    adapterContract,
    fetchDataPackages,
  }: UpdatePricesArgs): Promise<string | undefined> {
    const dataPackages = await fetchDataPackages();
    const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);
    const dataPackagesWrapper = new DataPackagesWrapper(dataPackages);

    const wrappedContract =
      dataPackagesWrapper.overwriteEthersContract(adapterContract);

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

import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { Contract, providers } from "ethers";
import {
  getAbiForAdapter,
  getIterationArgs,
  IRedstoneAdapter,
  RelayerConfig,
  setConfigProvider,
  UpdatePricesArgs,
} from "redstone-on-chain-relayer";
import {
  IterationArgs,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

export class IterationArgsProvider
  implements IterationArgsProviderInterface<UpdatePricesArgs>
{
  async getArgs(
    userArgs: Web3FunctionUserArgs,
    provider: providers.StaticJsonRpcProvider
  ): Promise<IterationArgs<UpdatePricesArgs>> {
    setConfigProvider(() => userArgs as unknown as RelayerConfig);

    const abi = getAbiForAdapter();

    const adapterContract = new Contract(
      userArgs.adapterContractAddress as unknown as string,
      abi,
      provider
    ) as IRedstoneAdapter;

    userArgs.minDeviationPercentage =
      (userArgs.minDeviationPermillage as number) / 10;

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
}

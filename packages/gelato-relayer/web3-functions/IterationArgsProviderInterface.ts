import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { providers } from "ethers";

export type IterationArgs<Args> = {
  shouldUpdatePrices: boolean;
  args?: Args;
  message?: string;
};

export type IterationArgsProviderEnv = {
  historicalPackagesGateway?: string;
  fallbackOffsetInMinutes: number;
};

export interface IterationArgsProviderInterface<Args> {
  adapterContractAddress?: string;

  getArgs(
    userArgs: Web3FunctionUserArgs,
    env: IterationArgsProviderEnv,
    provider: providers.StaticJsonRpcProvider
  ): Promise<IterationArgs<Args>>;

  getTransactionData(args: Args): Promise<string | undefined>;
}

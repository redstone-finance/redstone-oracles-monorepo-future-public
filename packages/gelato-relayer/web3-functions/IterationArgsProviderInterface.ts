import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { providers } from "ethers";

export type IterationArgs<Args> = {
  shouldUpdatePrices: boolean;
  args?: Args;
  message?: string;
};

export interface IterationArgsProviderInterface<Args> {
  getArgs(
    userArgs: Web3FunctionUserArgs,
    provider: providers.StaticJsonRpcProvider
  ): Promise<IterationArgs<Args>>;

  getTransactionData(args: Args): Promise<string | undefined>;
}

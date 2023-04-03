import { AccountInterface } from "starknet";
import prices_abi from "./prices_abi.json";
import { IContractConnector } from "redstone-sdk";
import { StarknetPricesContractAdapter } from "./StarknetPricesContractAdapter";
import {
  NetworkName,
  StarknetContractConnector,
} from "../StarknetContractConnector";

export class StarknetPricesContractConnector
  extends StarknetContractConnector
  implements IContractConnector<StarknetPricesContractAdapter>
{
  constructor(
    account: AccountInterface | undefined,
    contractAddress: string,
    network: NetworkName = "goerli-alpha"
  ) {
    super(account, contractAddress, prices_abi, network);
  }

  async getAdapter(): Promise<StarknetPricesContractAdapter> {
    return new StarknetPricesContractAdapter(await this.getContract());
  }
}

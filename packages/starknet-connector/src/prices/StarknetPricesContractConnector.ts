import { AccountInterface } from "starknet";
import {
  NetworkName,
  StarknetContractConnector,
} from "../StarknetContractConnector";
import { StarknetPricesContractAdapter } from "./StarknetPricesContractAdapter";
import prices_abi from "./prices_abi.json";

export class StarknetPricesContractConnector extends StarknetContractConnector<StarknetPricesContractAdapter> {
  constructor(
    account: AccountInterface | undefined,
    contractAddress: string,
    network: NetworkName = NetworkName.SN_GOERLI
  ) {
    super(account, contractAddress, prices_abi, network);
  }

  getAdapter(): Promise<StarknetPricesContractAdapter> {
    return Promise.resolve(
      new StarknetPricesContractAdapter(this.getContract())
    );
  }
}

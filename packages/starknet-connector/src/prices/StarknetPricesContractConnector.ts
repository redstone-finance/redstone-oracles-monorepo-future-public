import { AccountInterface } from "starknet";
import prices_abi from "./prices_abi.json";
import { StarknetPricesContractAdapter } from "./StarknetPricesContractAdapter";
import {
  NetworkName,
  StarknetContractConnector,
} from "../StarknetContractConnector";

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

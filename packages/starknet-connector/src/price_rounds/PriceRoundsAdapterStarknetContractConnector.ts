import {
  ContractParamsProvider,
  IContractConnector,
  IPriceManagerContractAdapter,
} from "@redstone-finance/sdk";
import { ProviderInterface } from "starknet";
import { StarknetContractConnector } from "../StarknetContractConnector";
import { PriceRoundsAdapterStarknetContractAdapter } from "./PriceRoundsAdapterStarknetContractAdapter";
import price_rounds_adapter_abi from "./price_rounds_adapter_abi.json";

export class PriceRoundsAdapterStarknetContractConnector
  extends StarknetContractConnector<IPriceManagerContractAdapter>
  implements IContractConnector<IPriceManagerContractAdapter>
{
  constructor(
    provider: ProviderInterface,
    address: string,
    private paramsProvider: ContractParamsProvider,
    private maxEthFee = 0.0004
  ) {
    super(provider, address, price_rounds_adapter_abi);
  }

  getAdapter(): Promise<IPriceManagerContractAdapter> {
    return Promise.resolve(
      new PriceRoundsAdapterStarknetContractAdapter(
        this.getContract(),
        this.paramsProvider,
        this.maxEthFee
      )
    );
  }
}

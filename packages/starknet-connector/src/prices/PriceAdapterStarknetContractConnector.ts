import { ProviderInterface } from "starknet";
import { StarknetContractConnector } from "../StarknetContractConnector";
import { PriceAdapterStarknetContractAdapter } from "./PriceAdapterStarknetContractAdapter";
import price_adapter_abi from "./price_adapter_abi.json";

export class PriceAdapterStarknetContractConnector extends StarknetContractConnector<PriceAdapterStarknetContractAdapter> {
  constructor(provider: ProviderInterface, contractAddress: string) {
    super(provider, contractAddress, price_adapter_abi);
  }

  getAdapter(): Promise<PriceAdapterStarknetContractAdapter> {
    return Promise.resolve(
      new PriceAdapterStarknetContractAdapter(this.getContract())
    );
  }
}

import {
  IContractConnector,
  IPriceFeedContractAdapter,
} from "@redstone-finance/sdk";
import { ProviderInterface } from "starknet";
import { StarknetContractConnector } from "../StarknetContractConnector";
import { PriceFeedStarknetContractAdapter } from "./PriceFeedStarknetContractAdapter";
import price_feed_abi from "./price_feed_abi.json";

export class PriceFeedStarknetContractConnector
  extends StarknetContractConnector<PriceFeedStarknetContractAdapter>
  implements IContractConnector<IPriceFeedContractAdapter>
{
  constructor(provider: ProviderInterface, contractAddress: string) {
    super(provider, contractAddress, price_feed_abi);
  }

  getAdapter(): Promise<PriceFeedStarknetContractAdapter> {
    return Promise.resolve(
      new PriceFeedStarknetContractAdapter(this.getContract())
    );
  }
}

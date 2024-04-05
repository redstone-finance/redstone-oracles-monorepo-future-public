import {
  IContractConnector,
  IPriceRoundsFeedContractAdapter,
} from "@redstone-finance/sdk";
import { ProviderInterface } from "starknet";
import { StarknetContractConnector } from "../StarknetContractConnector";
import { PriceRoundsFeedStarknetContractAdapter } from "./PriceRoundsFeedStarknetContractAdapter";
import price_rounds_feed_abi from "./price_rounds_feed_abi.json";

export class PriceRoundsFeedStarknetContractConnector
  extends StarknetContractConnector<IPriceRoundsFeedContractAdapter>
  implements IContractConnector<IPriceRoundsFeedContractAdapter>
{
  constructor(provider: ProviderInterface, feedContractAddress: string) {
    super(provider, feedContractAddress, price_rounds_feed_abi);
  }

  async getAdapter(): Promise<IPriceRoundsFeedContractAdapter> {
    return await Promise.resolve(
      new PriceRoundsFeedStarknetContractAdapter(this.getContract())
    );
  }
}

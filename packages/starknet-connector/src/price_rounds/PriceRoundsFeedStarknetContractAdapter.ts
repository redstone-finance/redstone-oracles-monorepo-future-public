import {
  IPriceRoundsFeedContractAdapter,
  PriceFeedRoundData,
} from "@redstone-finance/sdk";
import { Contract } from "starknet";

export class PriceRoundsFeedStarknetContractAdapter
  implements IPriceRoundsFeedContractAdapter
{
  constructor(private readonly contract: Contract) {}

  async readLatestRoundData(): Promise<PriceFeedRoundData> {
    return (await this.contract.call(
      "latest_round_data"
    )) as PriceFeedRoundData;
  }
}

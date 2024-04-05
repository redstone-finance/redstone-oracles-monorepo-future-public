import {
  IPriceRoundsFeedContractAdapter,
  PriceFeedRoundData,
} from "@redstone-finance/sdk";
import {
  AnyTonOpenedContract,
  TonPriceFeed,
  TonPriceFeedContractAdapter,
} from "@redstone-finance/ton-connector";

export class PriceFeedRelayerTonContractAdapter
  extends TonPriceFeedContractAdapter
  implements IPriceRoundsFeedContractAdapter
{
  constructor(contract: AnyTonOpenedContract<TonPriceFeed>) {
    super(contract);
  }

  async readLatestRoundData(): Promise<PriceFeedRoundData> {
    return { answer: (await this.getData()).value };
  }

  async fetchRoundData(): Promise<void> {
    await this.fetchData();
  }
}

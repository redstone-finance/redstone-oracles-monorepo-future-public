import { PriceFeedRoundData } from "@redstone-finance/sdk";
import { Contract } from "starknet";

export class PriceFeedContractAdapter {
  constructor(private readonly contract: Contract) {}

  async readLatestRoundData(): Promise<PriceFeedRoundData> {
    return (
      (await this.contract.call("latest_round_data")) as {
        round: PriceFeedRoundData;
      }
    )["round"];
  }
}

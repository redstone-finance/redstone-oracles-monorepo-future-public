import { Contract } from "starknet";
import { PriceFeedRoundData } from "redstone-sdk";

export class PriceFeedContractAdapter {
  constructor(private readonly contract: Contract) {}

  async readLatestRoundData(): Promise<PriceFeedRoundData> {
    return (
      (await this.contract.call("latest_round_data")) as {
        [key: string]: any;
      }
    )["round"];
  }
}

import { BigNumberish } from "ethers";

export type PriceFeedRoundData = { answer: BigNumberish };

export interface IPriceRoundsFeedContractAdapter {
  readLatestRoundData(): Promise<PriceFeedRoundData>;
}

import { BigNumberish } from "ethers";

export type PriceFeedRoundData = { answer: BigNumberish };

export interface IPriceFeedContractAdapter {
  readLatestRoundData(): Promise<PriceFeedRoundData>;
}

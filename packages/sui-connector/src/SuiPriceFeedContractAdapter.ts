import type {
  IPriceFeedContractAdapter,
  PriceAndTimestamp,
} from "@redstone-finance/sdk";

export class SuiPriceFeedContractAdapter implements IPriceFeedContractAdapter {
  constructor() {}

  getPriceAndTimestamp(): Promise<PriceAndTimestamp> {
    throw new Error("Method not implemented.");
  }
}

import {
  IPriceFeedContractAdapter,
  PriceAndTimestamp,
} from "@redstone-finance/sdk";
import { RadixContractAdapter } from "../../radix/RadixContractAdapter";
import { ReadPriceAndTimestampRadixMethod } from "./methods/ReadPriceAndTimestampRadixMethod";

export class PriceFeedRadixContractAdapter
  extends RadixContractAdapter
  implements IPriceFeedContractAdapter
{
  async getPriceAndTimestamp(): Promise<PriceAndTimestamp> {
    return await this.client.call(
      new ReadPriceAndTimestampRadixMethod(this.componentId)
    );
  }
}

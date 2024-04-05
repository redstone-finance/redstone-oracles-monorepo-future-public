import {
  IPriceFeedContractAdapter,
  PriceAndTimestamp,
} from "@redstone-finance/sdk";
import { Contract } from "starknet";
import { extractNumbers } from "../starknet-utils";

export class PriceFeedStarknetContractAdapter
  implements IPriceFeedContractAdapter
{
  constructor(private contract: Contract) {}

  async getPriceAndTimestamp(): Promise<PriceAndTimestamp> {
    const response = await this.contract.call("read_price_and_timestamp");
    const values = extractNumbers(Object.values(response));

    return {
      value: values[0],
      timestamp: values[1],
    };
  }
}

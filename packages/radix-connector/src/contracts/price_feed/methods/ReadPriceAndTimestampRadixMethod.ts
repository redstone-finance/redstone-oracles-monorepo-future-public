import { PriceAndTimestamp } from "@redstone-finance/sdk";
import { BigNumberish } from "ethers";
import { ValueProxyRadixInvocation } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";

export class ReadPriceAndTimestampRadixMethod extends ValueProxyRadixInvocation<PriceAndTimestamp> {
  constructor(component: string) {
    super(component, "read_price_and_timestamp_raw");
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this]);
  }

  override interpret(value: unknown[]) {
    return {
      value: value[0] as BigNumberish,
      timestamp: Number(value[1]),
    };
  }
}

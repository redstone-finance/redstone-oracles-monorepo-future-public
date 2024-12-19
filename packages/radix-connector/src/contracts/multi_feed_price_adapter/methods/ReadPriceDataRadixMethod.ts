import { Value } from "@radixdlt/radix-engine-toolkit";
import { BigNumberish } from "ethers";
import { ValueRadixInvocation } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";
import { makeFeedIds } from "../../../radix/utils";

export class ReadPriceDataRadixMethod extends ValueRadixInvocation<
  [BigNumberish, BigNumberish, BigNumberish][]
> {
  constructor(
    componentId: string,
    private dataFeedIds: string[]
  ) {
    super(componentId, "read_price_data_raw");
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this]);
  }

  override getParams(): Value[] {
    return [makeFeedIds(this.dataFeedIds)];
  }
}

import { Value } from "@radixdlt/radix-engine-toolkit";
import { BigNumberish } from "ethers";
import { ValueRadixInvocation } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";
import { makeFeedIds } from "../../../radix/utils";

export class ReadPricesRadixMethod extends ValueRadixInvocation<
  BigNumberish[]
> {
  constructor(
    componentId: string,
    private dataFeedIds: string[]
  ) {
    super(componentId, "read_prices");
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this]);
  }

  override getParams(): Value[] {
    return [makeFeedIds(this.dataFeedIds)];
  }
}

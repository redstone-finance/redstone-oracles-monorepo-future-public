import { Value } from "@radixdlt/radix-engine-toolkit";
import { BigNumberish } from "ethers";
import { ValueRadixInvocation } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";
import { makeFeedId } from "../../../radix/utils";

export class ReadTimestampRadixMethod extends ValueRadixInvocation<BigNumberish> {
  constructor(
    component: string,
    private feedId?: string
  ) {
    super(component, "read_timestamp");
  }

  override getParams(): Value[] {
    return this.feedId ? [makeFeedId(this.feedId)] : super.getParams();
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this]);
  }
}

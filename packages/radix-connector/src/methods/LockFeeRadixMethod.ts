import { decimal } from "@radixdlt/radix-engine-toolkit";
import { VoidRadixInvocation } from "../radix/RadixInvocation";

export class LockFeeRadixMethod extends VoidRadixInvocation {
  constructor(
    account: string,
    private fee: number
  ) {
    super(account, "lock_fee");
  }

  override getParams() {
    return [decimal(this.fee)];
  }
}

import { BigNumberish } from "ethers";
import { ValueRadixInvocation } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";

export class ReadTimestampRadixMethod extends ValueRadixInvocation<BigNumberish> {
  constructor(component: string) {
    super(component, "read_timestamp");
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this]);
  }
}

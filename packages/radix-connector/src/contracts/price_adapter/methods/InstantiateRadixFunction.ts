import { u8, Value } from "@radixdlt/radix-engine-toolkit";
import { RadixFunction } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";
import { makeSigners } from "../../../radix/utils";

export class InstantiateRadixFunction extends RadixFunction {
  constructor(
    packageId: string,
    private signerCountThreshold: number,
    private signers: string[]
  ) {
    super(packageId, "instantiate", "PriceAdapter");
  }

  override getParams(): Value[] {
    return [u8(this.signerCountThreshold), makeSigners(this.signers)];
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this], 100);
  }
}

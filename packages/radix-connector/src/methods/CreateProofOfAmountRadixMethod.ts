import { address, decimal } from "@radixdlt/radix-engine-toolkit";
import { VoidRadixInvocation } from "../radix/RadixInvocation";

export class CreateProofOfAmountRadixMethod extends VoidRadixInvocation {
  constructor(
    account: string,
    private proofResourceId: string
  ) {
    super(account, "create_proof_of_amount");
  }

  override getParams() {
    return [address(this.proofResourceId), decimal(1)];
  }
}

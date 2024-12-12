import { address } from "@radixdlt/radix-engine-toolkit";
import { VoidRadixInvocation } from "../../../radix/RadixInvocation";
import { ProvingRadixTransaction } from "../../../radix/RadixTransaction";
import { NonFungibleGlobalIdInput } from "../../../radix/utils";

export class SetGlobalContractAddressInvocationMethod extends VoidRadixInvocation {
  constructor(
    componentId: string,
    private contractGlobalAddress: string,
    private proofBadge: NonFungibleGlobalIdInput
  ) {
    super(componentId, "set_contract_global_address");
  }

  override getParams() {
    return [address(this.contractGlobalAddress)];
  }

  override getDedicatedTransaction(account: string) {
    return new ProvingRadixTransaction(account, [this], this.proofBadge);
  }
}

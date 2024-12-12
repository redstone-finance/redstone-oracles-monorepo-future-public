import {
  address,
  array,
  nonFungibleLocalId,
  Value,
  ValueKind,
} from "@radixdlt/radix-engine-toolkit";
import { VoidRadixInvocation } from "../radix/RadixInvocation";
import { NonFungibleGlobalIdInput } from "../radix/utils";

export class CreateProofOfNonFungiblesRadixMethod extends VoidRadixInvocation {
  constructor(
    account: string,
    private proof: NonFungibleGlobalIdInput
  ) {
    super(account, "create_proof_of_non_fungibles");
  }

  override getParams(): Value[] {
    return [
      address(this.proof.resourceAddress),
      array(
        ValueKind.NonFungibleLocalId,
        nonFungibleLocalId(this.proof.localId)
      ),
    ];
  }
}

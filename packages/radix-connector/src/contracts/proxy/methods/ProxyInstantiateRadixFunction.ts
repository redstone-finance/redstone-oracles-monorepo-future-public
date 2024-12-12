import { address } from "@radixdlt/radix-engine-toolkit";
import { RadixFunction } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";
import {
  makeNonFungibleGlobalId,
  makeOption,
  NonFungibleGlobalIdInput,
} from "../../../radix/utils";

export class ProxyInstantiateRadixFunction extends RadixFunction<string> {
  constructor(
    packageId: string,
    private ownerBadge: NonFungibleGlobalIdInput,
    private managerBadge: NonFungibleGlobalIdInput,
    private globalContractAddress?: string
  ) {
    super(packageId, "instantiate", "Proxy");
  }

  override getParams() {
    return [
      makeNonFungibleGlobalId(this.ownerBadge),
      makeNonFungibleGlobalId(this.managerBadge),
      makeOption(address, this.globalContractAddress),
    ];
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this]);
  }
}

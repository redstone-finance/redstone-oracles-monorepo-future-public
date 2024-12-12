import { address, Value } from "@radixdlt/radix-engine-toolkit";
import { DEFAULT_INSTANTIATE_XRD_FEE } from "../../../radix/constants";
import { RadixFunction } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";
import { makeFeedId } from "../../../radix/utils";

export class PriceFeedInstantiateRadixFunction extends RadixFunction<string> {
  constructor(
    packageId: string,
    private adapterAddress: string,
    private feedId: string,
    private fee = DEFAULT_INSTANTIATE_XRD_FEE
  ) {
    super(packageId, "instantiate", "PriceFeed");
  }

  override getParams(): Value[] {
    return [address(this.adapterAddress), makeFeedId(this.feedId)];
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this], this.fee);
  }
}

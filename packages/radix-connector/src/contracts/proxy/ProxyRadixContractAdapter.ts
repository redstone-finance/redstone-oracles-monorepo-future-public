import { RadixContractAdapter } from "../../radix/RadixContractAdapter";
import { NonFungibleGlobalIdInput } from "../../radix/utils";
import { SetGlobalContractAddressInvocationMethod } from "./methods/SetGlobalContractAddressInvocationMethod";

export class ProxyFeedRadixContractAdapter extends RadixContractAdapter {
  public async setContractGlobalAddress(
    address: string,
    proofBadge: NonFungibleGlobalIdInput
  ) {
    await this.client.call(
      new SetGlobalContractAddressInvocationMethod(
        this.componentId,
        address,
        proofBadge
      )
    );
  }
}

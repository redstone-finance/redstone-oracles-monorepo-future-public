import { RadixClient } from "../../radix/RadixClient";
import { NonFungibleGlobalIdInput } from "../../radix/utils";
import { ProxyInstantiateRadixFunction } from "./methods/ProxyInstantiateRadixFunction";
import { ProxyRadixContractConnector } from "./ProxyRadixContractConnector";

export class ProxyRadixContractDeployer extends ProxyRadixContractConnector {
  constructor(
    client: RadixClient,
    private packageId: string,
    private ownerBadge: NonFungibleGlobalIdInput,
    private manBadge: NonFungibleGlobalIdInput,
    private contractGlobalAddress?: string
  ) {
    super(client);
  }

  override async getComponentId() {
    if (this.componentId) {
      return this.componentId;
    }

    this.componentId = await this.instantiate();

    return this.componentId;
  }

  private async instantiate() {
    return await this.client.call(
      new ProxyInstantiateRadixFunction(
        this.packageId,
        this.ownerBadge,
        this.manBadge,
        this.contractGlobalAddress
      )
    );
  }
}

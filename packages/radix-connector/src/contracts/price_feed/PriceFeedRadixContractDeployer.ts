import { RadixClient } from "../../radix/RadixClient";
import { PriceAdapterRadixContractConnector } from "../price_adapter/PriceAdapterRadixContractConnector";
import { PriceFeedInstantiateRadixFunction } from "./methods/PriceFeedInstantiateRadixFunction";

export class PriceFeedRadixContractDeployer extends PriceAdapterRadixContractConnector {
  constructor(
    client: RadixClient,
    private packageId: string,
    private adapterAddress: string,
    private feedId: string
  ) {
    super(client);
  }

  override async getComponentId() {
    if (this.componentId) {
      return this.componentId;
    }

    this.componentId = await this.instantiate();

    return await super.getComponentId();
  }

  private async instantiate() {
    return await this.client.call(
      new PriceFeedInstantiateRadixFunction(
        this.packageId,
        this.adapterAddress,
        this.feedId
      )
    );
  }
}

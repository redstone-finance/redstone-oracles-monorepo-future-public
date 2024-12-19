import { RadixClient } from "../../radix/RadixClient";
import { RadixContractConnector } from "../../radix/RadixContractConnector";
import { PriceFeedRadixContractAdapter } from "./PriceFeedRadixContractAdapter";

export class PriceFeedRadixContractConnector extends RadixContractConnector<PriceFeedRadixContractAdapter> {
  constructor(client: RadixClient, proxyComponentId?: string) {
    super(client, proxyComponentId);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getComponentId() {
    return this.componentId!;
  }

  override async getAdapter() {
    return new PriceFeedRadixContractAdapter(
      this.client,
      await this.getComponentId()
    );
  }
}

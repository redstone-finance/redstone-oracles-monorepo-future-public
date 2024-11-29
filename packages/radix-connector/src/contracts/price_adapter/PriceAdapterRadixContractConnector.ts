import { RadixClient } from "../../radix/RadixClient";
import { RadixContractConnector } from "../../radix/RadixContractConnector";
import { PriceAdapterRadixContractAdapter } from "./PriceAdapterRadixContractAdapter";

export class PriceAdapterRadixContractConnector extends RadixContractConnector<PriceAdapterRadixContractAdapter> {
  constructor(client: RadixClient, componentId?: string) {
    super(client, componentId);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getComponentId() {
    return this.componentId!;
  }

  override async getAdapter(): Promise<PriceAdapterRadixContractAdapter> {
    return new PriceAdapterRadixContractAdapter(
      this.client,
      await this.getComponentId()
    );
  }
}

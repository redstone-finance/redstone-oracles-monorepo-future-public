import { PriceAdapterRadixContractConnector } from "../price_adapter/PriceAdapterRadixContractConnector";
import { MultiFeedPriceAdapterRadixContractAdapter } from "./MultiFeedPriceAdapterRadixContractAdapter";

export class MultiFeedPriceAdapterRadixContractConnector extends PriceAdapterRadixContractConnector {
  override async getAdapter() {
    return new MultiFeedPriceAdapterRadixContractAdapter(
      this.client,
      await this.getComponentId()
    );
  }
}

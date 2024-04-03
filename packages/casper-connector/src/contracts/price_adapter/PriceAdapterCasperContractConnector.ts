import { IPricesContractAdapter } from "@redstone-finance/sdk";
import { CasperConnector } from "../../casper/CasperConnector";
import { PriceAdapterCasperContractAdapter } from "./PriceAdapterCasperContractAdapter";

export class PriceAdapterCasperContractConnector extends CasperConnector<IPricesContractAdapter> {
  getAdapter(): Promise<IPricesContractAdapter> {
    return Promise.resolve(
      new PriceAdapterCasperContractAdapter(this.connection, this.getContract())
    );
  }
}

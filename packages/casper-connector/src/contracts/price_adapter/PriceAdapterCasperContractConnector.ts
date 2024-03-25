import { IPricesContractAdapter } from "@redstone-finance/sdk";
import { PriceAdapterCasperContractAdapter } from "./PriceAdapterCasperContractAdapter";
import { CasperConnector } from "../../casper/CasperConnector";

export class PriceAdapterCasperContractConnector extends CasperConnector<IPricesContractAdapter> {
  getAdapter(): Promise<IPricesContractAdapter> {
    return Promise.resolve(
      new PriceAdapterCasperContractAdapter(this.connection, this.getContract())
    );
  }
}

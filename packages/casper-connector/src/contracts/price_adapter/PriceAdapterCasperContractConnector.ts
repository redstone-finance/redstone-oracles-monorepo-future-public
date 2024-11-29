import { IPricesContractAdapter } from "@redstone-finance/sdk";
import { CasperContractConnector } from "../../casper/CasperContractConnector";
import { PriceAdapterCasperContractAdapter } from "./PriceAdapterCasperContractAdapter";

export class PriceAdapterCasperContractConnector extends CasperContractConnector<IPricesContractAdapter> {
  getAdapter(): Promise<IPricesContractAdapter> {
    return Promise.resolve(
      new PriceAdapterCasperContractAdapter(this.connection, this.getContract())
    );
  }
}

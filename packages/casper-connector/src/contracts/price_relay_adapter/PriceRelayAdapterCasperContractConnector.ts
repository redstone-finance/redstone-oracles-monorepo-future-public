import { CasperConnector } from "../../casper/CasperConnector";
import { IPricesContractAdapter } from "@redstone-finance/sdk";
import { PriceRelayAdapterCasperContractAdapter } from "./PriceRelayAdapterCasperContractAdapter";

export class PriceRelayAdapterCasperContractConnector extends CasperConnector<IPricesContractAdapter> {
  getAdapter(): Promise<IPricesContractAdapter> {
    return Promise.resolve(
      new PriceRelayAdapterCasperContractAdapter(
        this.connection,
        this.getContract()
      )
    );
  }
}

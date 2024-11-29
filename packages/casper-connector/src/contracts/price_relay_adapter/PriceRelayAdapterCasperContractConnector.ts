import { IPricesContractAdapter } from "@redstone-finance/sdk";
import { CasperContractConnector } from "../../casper/CasperContractConnector";
import { PriceRelayAdapterCasperContractAdapter } from "./PriceRelayAdapterCasperContractAdapter";

export class PriceRelayAdapterCasperContractConnector extends CasperContractConnector<IPricesContractAdapter> {
  getAdapter(): Promise<IPricesContractAdapter> {
    return Promise.resolve(
      new PriceRelayAdapterCasperContractAdapter(
        this.connection,
        this.getContract()
      )
    );
  }
}

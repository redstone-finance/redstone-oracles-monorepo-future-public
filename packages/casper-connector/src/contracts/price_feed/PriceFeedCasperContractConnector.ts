import { CasperContractConnector } from "../../casper/CasperContractConnector";
import { PriceFeedCasperContractAdapter } from "./PriceFeedCasperContractAdapter";

export class PriceFeedCasperContractConnector extends CasperContractConnector<PriceFeedCasperContractAdapter> {
  getAdapter(): Promise<PriceFeedCasperContractAdapter> {
    return Promise.resolve(
      new PriceFeedCasperContractAdapter(this.connection, this.getContract())
    );
  }
}

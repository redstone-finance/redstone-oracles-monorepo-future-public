import { CasperConnector } from "../../casper/CasperConnector";
import { PriceFeedCasperContractAdapter } from "./PriceFeedCasperContractAdapter";

export class PriceFeedCasperContractConnector extends CasperConnector<PriceFeedCasperContractAdapter> {
  getAdapter(): Promise<PriceFeedCasperContractAdapter> {
    return Promise.resolve(
      new PriceFeedCasperContractAdapter(this.connection, this.getContract())
    );
  }
}

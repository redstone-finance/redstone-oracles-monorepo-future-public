import { TonSingleFeedMan } from "../../wrappers/TonSingleFeedMan";
import { TonContractConnector } from "../TonContractConnector";
import { TonNetwork } from "../network/TonNetwork";
import { TonSingleFeedManContractAdapter } from "./TonSingleFeedManContractAdapter";

export class TonSingleFeedManContractConnector extends TonContractConnector<
  TonSingleFeedMan,
  TonSingleFeedManContractAdapter
> {
  constructor(network: TonNetwork, address: string) {
    super(TonSingleFeedMan, network, address);
  }

  async getAdapter(): Promise<TonSingleFeedManContractAdapter> {
    return new TonSingleFeedManContractAdapter(await this.getContract());
  }
}

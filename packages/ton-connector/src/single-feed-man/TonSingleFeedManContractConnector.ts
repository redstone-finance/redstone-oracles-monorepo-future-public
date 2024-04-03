import { TonContractConnector } from "../TonContractConnector";
import { TonSingleFeedManContractAdapter } from "./TonSingleFeedManContractAdapter";

import { TonSingleFeedMan } from "../../wrappers/TonSingleFeedMan";
import { TonNetwork } from "../network/TonNetwork";

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

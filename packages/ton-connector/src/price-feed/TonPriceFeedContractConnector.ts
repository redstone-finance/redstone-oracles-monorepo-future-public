import { TonPriceFeedContractAdapter } from "./TonPriceFeedContractAdapter";
import { TonPriceFeed } from "../../wrappers/TonPriceFeed";
import { TonContractConnector } from "../TonContractConnector";

import { TonNetwork } from "../network/TonNetwork";

export class TonPriceFeedContractConnector extends TonContractConnector<
  TonPriceFeed,
  TonPriceFeedContractAdapter
> {
  constructor(network: TonNetwork, address: string) {
    super(TonPriceFeed, network, address);
  }

  async getAdapter(): Promise<TonPriceFeedContractAdapter> {
    return new TonPriceFeedContractAdapter(await this.getContract());
  }
}

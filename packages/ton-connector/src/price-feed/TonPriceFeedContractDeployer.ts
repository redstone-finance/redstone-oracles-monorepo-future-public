import { TonContractDeployer } from "../TonContractDeployer";
import { TonPriceFeed } from "../../wrappers/TonPriceFeed";
import { TonPriceFeedContractAdapter } from "./TonPriceFeedContractAdapter";
import { PriceFeedInitData } from "./PriceFeedInitData";

import { TonNetwork } from "../network/TonNetwork";
import { Cell } from "@ton/core";

export class TonPriceFeedContractDeployer extends TonContractDeployer<
  TonPriceFeed,
  TonPriceFeedContractAdapter
> {
  constructor(network: TonNetwork, code: Cell, initData?: PriceFeedInitData) {
    super(TonPriceFeed, network, code, initData);
  }

  async getAdapter(): Promise<TonPriceFeedContractAdapter> {
    const contract = await this.getContract();
    await contract.sendDeploy();

    return new TonPriceFeedContractAdapter(contract);
  }
}

import { TonPriceFeed } from "../../wrappers/TonPriceFeed";
import { TonContractDeployer } from "../TonContractDeployer";
import { PriceFeedInitData } from "./PriceFeedInitData";
import { TonPriceFeedContractAdapter } from "./TonPriceFeedContractAdapter";

import { Cell } from "@ton/core";
import { TonNetwork } from "../network/TonNetwork";

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

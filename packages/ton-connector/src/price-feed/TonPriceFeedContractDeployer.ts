import { Cell } from "@ton/core";
import { TonPriceFeed } from "../../wrappers/TonPriceFeed";
import { TonContractDeployer } from "../TonContractDeployer";
import { TonNetwork } from "../network/TonNetwork";
import { PriceFeedInitData } from "./PriceFeedInitData";
import { TonPriceFeedContractAdapter } from "./TonPriceFeedContractAdapter";

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

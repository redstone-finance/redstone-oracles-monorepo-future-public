import { Cell } from "@ton/core";
import { TonSingleFeedMan } from "../../wrappers/TonSingleFeedMan";
import { TonContractDeployer } from "../TonContractDeployer";
import { TonNetwork } from "../network/TonNetwork";
import { SingleFeedManInitData } from "./SingleFeedManInitData";
import { TonSingleFeedManContractAdapter } from "./TonSingleFeedManContractAdapter";

export class TonSingleFeedManContractDeployer extends TonContractDeployer<
  TonSingleFeedMan,
  TonSingleFeedManContractAdapter
> {
  constructor(
    network: TonNetwork,
    code: Cell,
    initData?: SingleFeedManInitData
  ) {
    super(TonSingleFeedMan, network, code, initData);
  }

  async getAdapter(): Promise<TonSingleFeedManContractAdapter> {
    const contract = await this.getContract();
    await contract.sendDeploy();

    return new TonSingleFeedManContractAdapter(contract);
  }
}

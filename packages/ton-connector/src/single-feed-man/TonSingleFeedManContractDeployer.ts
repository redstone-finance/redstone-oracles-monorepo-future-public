import { TonContractDeployer } from "../TonContractDeployer";
import { TonSingleFeedManContractAdapter } from "./TonSingleFeedManContractAdapter";

import { TonNetwork } from "../network/TonNetwork";
import { Cell } from "ton-core";
import { SingleFeedManInitData } from "./SingleFeedManInitData";
import { TonSingleFeedMan } from "../../wrappers/TonSingleFeedMan";

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

import { TonContractDeployer } from "../TonContractDeployer";
import { TonSampleConsumerContractAdapter } from "./TonSampleConsumerContractAdapter";

import { Cell } from "@ton/core";
import { TonSampleConsumer } from "../../wrappers/TonSampleConsumer";
import { TonNetwork } from "../network/TonNetwork";
import { SampleConsumerInitData } from "./SampleConsumerInitData";

export class TonSampleConsumerContractDeployer extends TonContractDeployer<
  TonSampleConsumer,
  TonSampleConsumerContractAdapter
> {
  constructor(
    network: TonNetwork,
    code: Cell,
    initData?: SampleConsumerInitData
  ) {
    super(TonSampleConsumer, network, code, initData);
  }

  async getAdapter(): Promise<TonSampleConsumerContractAdapter> {
    const contract = await this.getContract();
    await contract.sendDeploy();

    return new TonSampleConsumerContractAdapter(contract);
  }
}

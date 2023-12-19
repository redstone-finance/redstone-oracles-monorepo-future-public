import { TonContractDeployer } from "../TonContractDeployer";
import { TonSampleConsumerContractAdapter } from "./TonSampleConsumerContractAdapter";

import { TonNetwork } from "../network/TonNetwork";
import { Cell } from "@ton/core";
import { SampleConsumerInitData } from "./SampleConsumerInitData";
import { TonSampleConsumer } from "../../wrappers/TonSampleConsumer";

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

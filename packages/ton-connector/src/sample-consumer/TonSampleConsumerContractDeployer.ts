import { Cell } from "@ton/core";
import { TonSampleConsumer } from "../../wrappers/TonSampleConsumer";
import { TonContractDeployer } from "../TonContractDeployer";
import { TonNetwork } from "../network/TonNetwork";
import { SampleConsumerInitData } from "./SampleConsumerInitData";
import { TonSampleConsumerContractAdapter } from "./TonSampleConsumerContractAdapter";

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

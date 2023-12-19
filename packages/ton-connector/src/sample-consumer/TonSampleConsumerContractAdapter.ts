import { AnyTonOpenedContract } from "../network/TonNetwork";
import { TonSampleConsumer } from "../../wrappers/TonSampleConsumer";

export class TonSampleConsumerContractAdapter {
  constructor(
    public readonly contract: AnyTonOpenedContract<TonSampleConsumer>
  ) {}

  async sendDeploy(): Promise<void> {
    await this.contract.sendDeploy();
  }

  async readData() {
    return await this.contract.sendReadData();
  }
}

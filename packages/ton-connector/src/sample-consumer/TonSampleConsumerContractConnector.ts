import { TonContractConnector } from "../TonContractConnector";
import { TonSampleConsumerContractAdapter } from "./TonSampleConsumerContractAdapter";

import { TonSampleConsumer } from "../../wrappers/TonSampleConsumer";
import { TonNetwork } from "../network/TonNetwork";

export class TonSampleConsumerContractConnector extends TonContractConnector<
  TonSampleConsumer,
  TonSampleConsumerContractAdapter
> {
  constructor(network: TonNetwork, address: string) {
    super(TonSampleConsumer, network, address);
  }

  async getAdapter(): Promise<TonSampleConsumerContractAdapter> {
    return new TonSampleConsumerContractAdapter(await this.getContract());
  }
}

import { TonSampleConsumerContractAdapter } from "./TonSampleConsumerContractAdapter";
import { TonContractConnector } from "../TonContractConnector";

import { TonNetwork } from "../network/TonNetwork";
import { TonSampleConsumer } from "../../wrappers/TonSampleConsumer";

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

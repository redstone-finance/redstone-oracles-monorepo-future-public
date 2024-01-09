import { ContractProvider } from "@ton/core";
import { TonContract } from "../src/TonContract";
import { OP_REDSTONE_READ_DATA } from "../src/config/constants";
import { messageBuilder } from "../src/ton-utils";

/* eslint-disable  @typescript-eslint/class-methods-use-this -- TON Getter methods must not be static */
export class TonSampleConsumer extends TonContract {
  static override getName(): string {
    return "sample_consumer";
  }

  async sendReadData(provider: ContractProvider) {
    const builder = messageBuilder(OP_REDSTONE_READ_DATA);
    const body = builder.endCell();

    return await this.internalMessage(provider, 0.025, body);
  }
}

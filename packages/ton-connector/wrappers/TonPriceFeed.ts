import { ContractProvider } from "@ton/core";
import { TonContract } from "../src/TonContract";
import { OP_REDSTONE_FETCH_DATA } from "../src/config/constants";
import { createArrayFromTuple, messageBuilder } from "../src/ton-utils";

/* eslint-disable  @typescript-eslint/class-methods-use-this -- TON Getter methods must not be static */
export class TonPriceFeed extends TonContract {
  static override getName(): string {
    return "price_feed";
  }

  async getData(provider: ContractProvider) {
    const { stack } = await provider.get("get_price_and_timestamp", []);

    const result = createArrayFromTuple(stack);

    return { value: result[0], timestamp: Number(result[1]) };
  }

  async sendFetchData(provider: ContractProvider) {
    const builder = messageBuilder(OP_REDSTONE_FETCH_DATA);
    const body = builder.endCell();

    await this.internalMessage(provider, 0.025, body);
  }
}

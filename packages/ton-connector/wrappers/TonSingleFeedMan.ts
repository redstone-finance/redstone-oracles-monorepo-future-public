import { ContractParamsProvider } from "@redstone-finance/sdk";
import { ContractProvider } from "@ton/core";
import { TonContract } from "../src/TonContract";
import { OP_REDSTONE_WRITE_PRICE } from "../src/config/constants";
import { createPayloadCell } from "../src/create-payload-cell";
import { messageBuilder } from "../src/ton-utils";

/* eslint-disable  @typescript-eslint/class-methods-use-this -- TON Getter methods must not be static */
export class TonSingleFeedMan extends TonContract {
  static override getName(): string {
    return "single_feed_man";
  }

  async sendWritePrice(
    provider: ContractProvider,
    paramsProvider: ContractParamsProvider
  ) {
    const builder = messageBuilder(OP_REDSTONE_WRITE_PRICE);

    const payloadCell = createPayloadCell(
      await paramsProvider.getPayloadHex(false)
    );

    builder.storeRef(payloadCell);

    const body = builder.endCell();

    return await this.internalMessage(
      provider,
      paramsProvider.requestParams.dataPackagesIds.length *
        paramsProvider.requestParams.uniqueSignersCount *
        0.05,
      body
    );
  }

  async getReadPriceAndTimestamp(provider: ContractProvider) {
    const { stack } = await provider.get("read_price_and_timestamp", []);

    return {
      price: stack.readBigNumber(),
      timestamp: Number(stack.readBigNumber()),
    };
  }

  async getPrice(
    provider: ContractProvider,
    paramsProvider: ContractParamsProvider
  ) {
    const payloadCell = createPayloadCell(
      await paramsProvider.getPayloadHex(false)
    );

    const { stack } = await this.getAltApiContractProvider(provider).get(
      "get_price",
      [{ type: "cell", cell: payloadCell }]
    );

    return {
      price: stack.readBigNumber(),
      timestamp: Number(stack.readBigNumber()),
    };
  }
}

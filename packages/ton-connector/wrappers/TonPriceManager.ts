import { Cell, ContractProvider, serializeTuple, TupleItem } from "ton-core";
import { createPayloadCell } from "../src/create-payload-cell";
import {
  createArrayFromSerializedTuple,
  createArrayFromTuple,
  createTupleItems,
  messageBuilder,
} from "../src/ton-utils";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { TonContract } from "../src/TonContract";
import { OP_REDSTONE_WRITE_PRICES } from "../src/config/operations";
import { consts } from "@redstone-finance/protocol";

/* eslint-disable  @typescript-eslint/class-methods-use-this -- TON Getter methods must not be static */
export class TonPriceManager extends TonContract {
  static override getName(): string {
    return "price_manager";
  }

  async sendWritePrices(
    provider: ContractProvider,
    paramsProvider: ContractParamsProvider
  ) {
    const builder = messageBuilder(OP_REDSTONE_WRITE_PRICES);

    const payloadCell = createPayloadCell(
      await paramsProvider.getPayloadHex(false)
    );

    const dataFeedsIdsCell = serializeTuple(
      createTupleItems(paramsProvider.getHexlifiedFeedIds())
    );
    builder.storeRef(dataFeedsIdsCell);
    builder.storeRef(payloadCell);

    const body = builder.endCell();

    return await this.internalMessage(
      provider,
      paramsProvider.requestParams.dataFeeds!.length *
        paramsProvider.requestParams.uniqueSignersCount *
        0.05,
      body
    );
  }

  async getReadPrices(
    provider: ContractProvider,
    paramsProvider: ContractParamsProvider
  ) {
    const { stack } = await provider.get("read_prices", [
      {
        type: "tuple",
        items: createTupleItems(paramsProvider.getHexlifiedFeedIds()),
      },
    ]);

    return createArrayFromTuple(stack.readTuple());
  }

  async getReadTimestamp(provider: ContractProvider) {
    const { stack } = await provider.get("read_timestamp", []);

    return stack.readNumber();
  }

  async getPrices(
    provider: ContractProvider,
    paramsProvider: ContractParamsProvider
  ) {
    const payloadCell = createPayloadCell(
      await paramsProvider.getPayloadHex(false)
    );

    const dataFeedIds = createTupleItems(paramsProvider.getHexlifiedFeedIds());

    // the v4 api is using only GET methods with limited parameter length, so it works only when the payload is small;
    // also don't support ECRECOVER
    const shouldUseOldApi = true; // !!this.oldApi;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Technical
    return shouldUseOldApi
      ? await this.getPricesV2(provider, dataFeedIds, payloadCell)
      : await this.getPricesV4(provider, dataFeedIds, payloadCell);
  }

  private async getPricesV2(
    provider: ContractProvider,
    dataFeedIds: TupleItem[],
    payloadCell: Cell
  ) {
    const getProvider = this.oldApi?.provider(this.address, null) ?? provider;

    const { stack } = await getProvider.get("get_prices_v2", [
      {
        type: "cell",
        cell: serializeTuple(dataFeedIds),
      },
      { type: "cell", cell: payloadCell },
    ]);

    return createArrayFromSerializedTuple(
      stack.readCell(),
      consts.DEFAULT_NUM_VALUE_BS * 8
    );
  }

  private async getPricesV4(
    provider: ContractProvider,
    dataFeedIds: TupleItem[],
    payloadCell: Cell
  ) {
    const { stack } = await provider.get("get_prices", [
      {
        type: "tuple",
        items: dataFeedIds,
      },
      { type: "cell", cell: payloadCell },
    ]);

    return createArrayFromTuple(stack.readTuple());
  }
}

import { ContractParamsProvider } from "@redstone-finance/sdk";
import { ContractProvider } from "@ton/core";
import { TonContract } from "../../src/TonContract";
import { createPayloadCell } from "../../src/create-payload-cell";
import { createArrayFromTuple, createTupleItems } from "../../src/ton-utils";

/* eslint-disable  @typescript-eslint/class-methods-use-this -- TON Getter methods must not be static */
export class TonTester extends TonContract {
  async getTestProcessPayload(
    provider: ContractProvider,
    paramsProvider: ContractParamsProvider,
    signers: string[],
    uniqueSignersThreshold: number,
    currentTimestamp: number
  ) {
    const payloadCell = createPayloadCell(
      await paramsProvider.getPayloadHex(false)
    );

    const dataFeedIds = createTupleItems(paramsProvider.getHexlifiedFeedIds());

    const { stack } = await provider.get("test_process_payload", [
      {
        type: "tuple",
        items: dataFeedIds,
      },
      { type: "tuple", items: createTupleItems(signers) },
      { type: "int", value: BigInt(uniqueSignersThreshold) },
      { type: "int", value: BigInt(currentTimestamp) },
      { type: "cell", cell: payloadCell },
    ]);

    return {
      values: createArrayFromTuple(stack.readTuple()),
      minTimestamp: stack.readNumber(),
    };
  }
}

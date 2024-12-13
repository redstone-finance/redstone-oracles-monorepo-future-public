import { Value } from "@radixdlt/radix-engine-toolkit";
import { BigNumberish } from "ethers";
import { RadixInvocation } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";
import { makeBytes, makeFeedIds } from "../../../radix/utils";

export class GetPricesRadixMethod extends RadixInvocation<{
  timestamp: number;
  values: BigNumberish[];
}> {
  constructor(
    componentId: string,
    private dataFeedIds: string[],
    private payloadBytes: number[],
    private fee = dataFeedIds.length,
    name: string = "get_prices_raw"
  ) {
    super(componentId, name);
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this], this.fee);
  }

  override getParams(): Value[] {
    return [makeFeedIds(this.dataFeedIds), makeBytes(this.payloadBytes)];
  }

  override interpret(value: unknown[]) {
    return {
      timestamp: value[0] as number,
      values: value[1] as BigNumberish[],
    };
  }
}

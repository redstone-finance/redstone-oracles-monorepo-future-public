import { expression, Expression, Value } from "@radixdlt/radix-engine-toolkit";
import { VoidRadixInvocation } from "../radix/RadixInvocation";

export class DepositBatchRadixMethod extends VoidRadixInvocation {
  constructor(component: string) {
    super(component, "deposit_batch");
  }

  override getParams(): Value[] {
    return [expression(Expression.EntireWorktop)];
  }
}

import { ManifestBuilder } from "@radixdlt/radix-engine-toolkit";
import { CreateProofOfAmountRadixMethod } from "../methods/CreateProofOfAmountRadixMethod";
import { DepositBatchRadixMethod } from "../methods/DepositBatchRadixMethod";
import { LockFeeRadixMethod } from "../methods/LockFeeRadixMethod";
import { RadixInvocation } from "./RadixInvocation";

export class RadixTransaction {
  constructor(
    protected account: string,
    private bodyMethods: RadixInvocation<unknown>[],
    private fee = 1
  ) {}

  getInitMethods(): RadixInvocation<unknown>[] {
    return [new LockFeeRadixMethod(this.account, this.fee)];
  }

  getFinalMethods(): RadixInvocation<unknown>[] {
    return [new DepositBatchRadixMethod(this.account)];
  }

  private getMethods(): RadixInvocation<unknown>[] {
    return [
      ...this.getInitMethods(),
      ...this.bodyMethods,
      ...this.getFinalMethods(),
    ];
  }

  getManifest() {
    let builder = new ManifestBuilder();

    for (const method of this.getMethods()) {
      builder = method.appendTo(builder);
    }

    return builder.build();
  }

  interpret(output: unknown[]) {
    const index = 1 + this.getFinalMethods().length;

    return this.bodyMethods[this.bodyMethods.length - 1].interpret(
      output[output.length - index]
    );
  }
}

export class OwnableRadixTransaction extends RadixTransaction {
  constructor(
    account: string,
    bodyMethods: RadixInvocation<unknown>[],
    private proofResourceId: string,
    fee = 1
  ) {
    super(account, bodyMethods, fee);
  }

  override getInitMethods(): RadixInvocation<unknown>[] {
    return [
      ...super.getInitMethods(),
      new CreateProofOfAmountRadixMethod(this.account, this.proofResourceId),
    ];
  }
}

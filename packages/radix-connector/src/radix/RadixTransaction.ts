import { ManifestBuilder } from "@radixdlt/radix-engine-toolkit";
import { CreateProofOfNonFungiblesRadixMethod } from "../methods/CreateProofOfNonFungiblesRadixMethod";
import { DepositBatchRadixMethod } from "../methods/DepositBatchRadixMethod";
import { LockFeeRadixMethod } from "../methods/LockFeeRadixMethod";
import { DEFAULT_TRANSACTION_XRD_FEE } from "./constants";
import { RadixInvocation } from "./RadixInvocation";
import { NonFungibleGlobalIdInput } from "./utils";

export class RadixTransaction {
  constructor(
    protected account: string,
    protected bodyMethods: RadixInvocation<unknown>[],
    private fee = DEFAULT_TRANSACTION_XRD_FEE
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
    const index = DEFAULT_TRANSACTION_XRD_FEE + this.getFinalMethods().length;

    return this.bodyMethods[this.bodyMethods.length - 1].interpret(
      output[output.length - index]
    );
  }
}

export class ProvingRadixTransaction extends RadixTransaction {
  constructor(
    account: string,
    bodyMethods: RadixInvocation<unknown>[],
    private proofBadge: NonFungibleGlobalIdInput,
    fee = DEFAULT_TRANSACTION_XRD_FEE
  ) {
    super(account, bodyMethods, fee);
  }

  override getInitMethods(): RadixInvocation<unknown>[] {
    return [
      ...super.getInitMethods(),
      new CreateProofOfNonFungiblesRadixMethod(this.account, this.proofBadge),
    ];
  }
}

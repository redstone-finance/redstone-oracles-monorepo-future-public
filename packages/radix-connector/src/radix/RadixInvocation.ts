import {
  ManifestBuilder,
  str,
  tuple,
  Value,
} from "@radixdlt/radix-engine-toolkit";
import { RadixTransaction } from "./RadixTransaction";

export abstract class RadixInvocation<T> {
  constructor(
    protected subject: string,
    protected name: string
  ) {}

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  getParams(): Value[] {
    return [];
  }

  appendTo(builder: ManifestBuilder) {
    return builder.callMethod(this.subject, this.name, this.getParams());
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  getDedicatedTransaction(
    _account: string,
    _proofResourceId?: string
  ): RadixTransaction {
    throw new Error("This method cannot by called directly");
  }

  abstract interpret(value: unknown): T;
}

export abstract class ProxyRadixInvocation<T> extends RadixInvocation<T> {
  override appendTo(builder: ManifestBuilder): ManifestBuilder {
    const params = [str(this.name), tuple(...this.getParams())];

    return builder.callMethod(this.subject, "call_method", params);
  }
}

export abstract class VoidRadixInvocation extends RadixInvocation<void> {
  override interpret(_value: unknown) {
    return;
  }
}

export abstract class ValueRadixInvocation<T> extends RadixInvocation<T> {
  override interpret(value: unknown) {
    return value as T;
  }
}

export abstract class ValueProxyRadixInvocation<
  T,
> extends ProxyRadixInvocation<T> {
  override interpret(value: unknown) {
    return value as T;
  }
}

export abstract class RadixFunction<T> extends ValueRadixInvocation<T> {
  protected constructor(
    packageAddress: string,
    name: string,
    private blueprintName: string
  ) {
    super(packageAddress, name);
  }

  override appendTo(builder: ManifestBuilder) {
    return builder.callFunction(
      this.subject,
      this.blueprintName,
      this.name,
      this.getParams()
    );
  }
}

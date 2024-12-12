import { RadixFunction } from "../../../radix/RadixInvocation";
import { RadixTransaction } from "../../../radix/RadixTransaction";

export class CreateBadgesRadixFunction extends RadixFunction<void> {
  constructor(packageId: string) {
    super(packageId, "create_badges", "BadgeCreator");
  }

  override getDedicatedTransaction(account: string) {
    return new RadixTransaction(account, [this]);
  }

  override interpret(_value: unknown[]) {
    return;
  }
}

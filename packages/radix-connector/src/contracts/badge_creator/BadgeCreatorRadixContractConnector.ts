import { RadixClient } from "../../radix/RadixClient";
import { RadixContractConnector } from "../../radix/RadixContractConnector";
import { CreateBadgesRadixFunction } from "./methods/CreateBadgesRadixFunction";

export class BadgeCreatorRadixContractConnector extends RadixContractConnector<void> {
  constructor(
    client: RadixClient,
    private packageId: string
  ) {
    super(client);
  }

  override getAdapter() {
    return Promise.resolve();
  }

  async createBadges() {
    return await this.client.call(
      new CreateBadgesRadixFunction(this.packageId)
    );
  }
}

import { IContractConnector } from "@redstone-finance/sdk";
import { RadixClient } from "./RadixClient";

export abstract class RadixContractConnector<Adapter>
  implements IContractConnector<Adapter>
{
  constructor(
    protected client: RadixClient,
    protected componentId?: string
  ) {}

  abstract getAdapter(): Promise<Adapter>;

  async getBlockNumber(): Promise<number> {
    return await this.client.getCurrentEpochNumber();
  }

  async waitForTransaction(transactionId: string): Promise<boolean> {
    return await this.client.waitForCommit(transactionId);
  }
}

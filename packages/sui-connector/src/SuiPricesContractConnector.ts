import { SuiClient } from "@mysten/sui/client";
import { Keypair } from "@mysten/sui/cryptography";
import type {
  IContractConnector,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { SuiPricesContractAdapter } from "./SuiPricesContractAdapter";
import { SuiConfig } from "./config";

export class SuiPricesContractConnector
  implements IContractConnector<IPricesContractAdapter>
{
  constructor(
    private readonly client: SuiClient,
    private readonly config: SuiConfig,
    private readonly keypair: Keypair
  ) {}

  getAdapter(): Promise<SuiPricesContractAdapter> {
    return Promise.resolve(
      new SuiPricesContractAdapter(this.client, this.config, this.keypair)
    );
  }

  async getBlockNumber(): Promise<number> {
    return Number(await this.client.getLatestCheckpointSequenceNumber());
  }

  async waitForTransaction(txId: string): Promise<boolean> {
    const tx = await this.client.waitForTransaction({ digest: txId });
    return tx.digest === txId;
  }
}

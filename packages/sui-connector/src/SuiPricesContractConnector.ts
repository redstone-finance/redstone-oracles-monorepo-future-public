import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Keypair } from "@mysten/sui/cryptography";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import type {
  IContractConnector,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { loggerFactory } from "@redstone-finance/utils";
import { SuiPricesContractAdapter } from "./SuiPricesContractAdapter";
import { SuiConfig } from "./config";

export class SuiPricesContractConnector
  implements IContractConnector<IPricesContractAdapter>
{
  private readonly logger = loggerFactory("sui-prices-contract-connector");

  constructor(
    private readonly client: SuiClient,
    private readonly config: SuiConfig,
    private readonly keypair?: Keypair
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
    await this.client.waitForTransaction({ digest: txId });
    const response = await this.client.getTransactionBlock({
      digest: txId,
      options: {
        showEffects: true,
        showBalanceChanges: true,
      },
    });
    const status = response.effects!.status.status;
    const success = status == "success";
    const cost = SuiPricesContractConnector.getCost(response);

    this.logger.log(
      `Transaction ${txId} finished, status: ${status.toUpperCase()}${success ? "" : ` (${response.effects!.status.error})`}, cost: ${cost} SUI, timestamp: ${response.timestampMs}`,
      response.errors
    );

    return success;
  }

  private static getCost(response: SuiTransactionBlockResponse) {
    return (
      Number(BigInt(response.balanceChanges![0].amount.replace("-", ""))) /
      Number(MIST_PER_SUI)
    );
  }
}

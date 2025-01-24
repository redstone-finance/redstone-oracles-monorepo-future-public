import { SuiClient, SuiTransactionBlockResponse } from "@mysten/sui/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import type { IContractConnector } from "@redstone-finance/sdk";
import { loggerFactory } from "@redstone-finance/utils";

export class SuiContractConnector<Adapter>
  implements IContractConnector<Adapter>
{
  private readonly logger = loggerFactory("sui-contract-connector");

  constructor(protected readonly client: SuiClient) {}

  /// TODO: Broken ISP leads to forced error throwing here
  /// The method shouldn't be be used for non-specified ContractConnectors
  getAdapter(): Promise<Adapter> {
    throw new Error("getAdapter is not implemented");
  }

  async getBlockNumber(): Promise<number> {
    return Number(await this.client.getLatestCheckpointSequenceNumber());
  }

  async getNormalizedBalance(address: string): Promise<bigint> {
    return (
      BigInt((await this.client.getBalance({ owner: address })).totalBalance) *
      (10n ** 18n / MIST_PER_SUI)
    );
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
    const cost = SuiContractConnector.getCost(response);

    this.logger.log(
      `Transaction ${txId} finished, status: ${status.toUpperCase()}${success ? "" : ` (${response.effects!.status.error})`}, cost: ${cost} SUI, timestamp: ${response.timestampMs}`,
      { errors: response.errors, gasUsed: response.effects!.gasUsed }
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

import { IContractConnector } from "@redstone-finance/sdk";
import { Account } from "fuels";

export const FUEL_BASE_GAS_LIMIT = 1000000;

export abstract class FuelContractConnector<Adapter>
  implements IContractConnector<Adapter>
{
  constructor(
    protected wallet: Account,
    protected contractId: string,
    protected gasLimit = FUEL_BASE_GAS_LIMIT
  ) {}

  abstract getAdapter(): Promise<Adapter>;

  getGasLimit(): number {
    return this.gasLimit;
  }

  async getBlockTimestamp(idOrHeight: number | string = "latest") {
    const TAI64_UNIX_ADJUSTMENT = BigInt(
      "0b100000000000000000000000000000000000000000000000000000000001010" // 2^62 + 10
    );

    const latestBlock = await this.wallet.provider.getBlock(idOrHeight);

    if (!latestBlock) {
      throw new Error(`Failed to fetch block ${idOrHeight} info`);
    }

    return Number(BigInt(latestBlock.time) - TAI64_UNIX_ADJUSTMENT) * 1000;
  }

  async getBlockNumber(): Promise<number> {
    return Number(await this.wallet.provider.getBlockNumber());
  }

  async waitForTransaction(txId: string): Promise<boolean> {
    const response = await this.wallet.provider.getTransactionResponse(txId);
    const result = await response.waitForResult();

    return result.isStatusSuccess;
  }
}

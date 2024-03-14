import { providers } from "ethers";
import { GasEstimator } from "./GasEstimator";
import {
  TransactionDeliveryManOptsValidated,
  unsafeBnToNumber,
} from "./TransactionDeliveryMan";

// especially for networks where pending blocks can be empty (low blockchain usage)
// in that cases rewards are defined as zeroes: 'All zeroes are returned if the block is empty.'
const DEFAULT_MAX_PRIORITY_FEE_PER_GAS = 1e9; // 1 GWEI

type FeeHistoryResponse = { reward: string[] };

export type Eip1559Fee = {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
};

export class Eip1559GasEstimator implements GasEstimator<Eip1559Fee> {
  constructor(readonly opts: TransactionDeliveryManOptsValidated) {}

  /** this is reasonable (ether.js is not reasonable) fallback if gasOracle is not set */
  async getFees(provider: providers.JsonRpcProvider): Promise<Eip1559Fee> {
    const lastBlock = await provider.getBlock("latest");
    const maxPriorityFeePerGas = await this.estimatePriorityFee(provider);

    const baseFee = Math.round(unsafeBnToNumber(lastBlock.baseFeePerGas!));
    const maxFeePerGas = baseFee + maxPriorityFeePerGas;

    const fee: Eip1559Fee = {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    this.opts.logger(`getFees result from provider ${JSON.stringify(fee)}`);

    return fee;
  }

  /**
   * Take value of percentileOfPriorityFee from last 2 blocks.
   * And return maximal value from it.
   */
  private async estimatePriorityFee(
    provider: providers.JsonRpcProvider
  ): Promise<number> {
    const feeHistory = await this.getFeeHistory(provider, "pending");

    const rewardsPerBlockForPercentile = feeHistory.reward
      .flat()
      .map((hex: string) => parseInt(hex, 16));

    return (
      Math.max(...rewardsPerBlockForPercentile) ||
      DEFAULT_MAX_PRIORITY_FEE_PER_GAS
    );
  }

  /**
   * https://docs.alchemy.com/reference/eth-feehistory
   * pending is better because serves newest information, however some RPCs doesn't support it like tBNB
   */
  private async getFeeHistory(
    provider: providers.JsonRpcProvider,
    newestBlock: "pending"
  ): Promise<FeeHistoryResponse> {
    return (await provider.send("eth_feeHistory", [
      "0x2",
      newestBlock,
      [this.opts.percentileOfPriorityFee],
    ])) as FeeHistoryResponse;
  }

  scaleFees(currentFees: Eip1559Fee, attempt: number): Eip1559Fee {
    const multipleBy = this.opts.multiplier ** attempt;
    const maxPriorityFeePerGas = Math.round(
      currentFees.maxPriorityFeePerGas * multipleBy
    );
    const maxFeePerGas = Math.round(currentFees.maxFeePerGas * multipleBy);

    const scaledFees: Eip1559Fee = {
      maxPriorityFeePerGas,
      maxFeePerGas,
    };

    this.opts.logger(
      `Scaling fees (multiplier=${multipleBy}) to ${JSON.stringify(scaledFees)}`
    );

    return scaledFees;
  }
}

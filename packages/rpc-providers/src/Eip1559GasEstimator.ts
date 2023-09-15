import { BigNumber, providers } from "ethers";
import {
  TransactionDeliveryManOpts,
  unsafeBnToNumber,
} from "./TransactionDeliveryMan";
import { GasEstimator } from "./GasEstimator";

type FeeHistoryResponse = { reward: string[] };

export type Eip1559Fee = {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  gasLimit: number;
};

export class Eip1559GasEstimator implements GasEstimator<Eip1559Fee> {
  constructor(readonly opts: Required<TransactionDeliveryManOpts>) {}

  /** this is reasonable (ether.js is not reasonable) fallback if gasOracle is not set */
  async getFees(provider: providers.JsonRpcProvider): Promise<Eip1559Fee> {
    const lastBlock = await provider.getBlock("latest");
    const maxPriorityFeePerGas = await this.estimatePriorityFee(provider);

    const baseFee = Math.round(
      unsafeBnToNumber(lastBlock.baseFeePerGas as BigNumber)
    );
    const maxFeePerGas = baseFee + maxPriorityFeePerGas;

    const fee: Eip1559Fee = {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit: this.opts.gasLimit,
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

    return Math.max(...rewardsPerBlockForPercentile);
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

  scaleFees(currentFees: Eip1559Fee): Eip1559Fee {
    const maxPriorityFeePerGas = Math.round(
      currentFees.maxPriorityFeePerGas * this.opts.multiplier
    );
    const maxFeePerGas = Math.round(
      currentFees.maxFeePerGas * this.opts.multiplier
    );
    const gasLimit = this.opts.twoDimensionFees
      ? Math.round(currentFees.gasLimit * this.opts.gasLimitMultiplier)
      : currentFees.gasLimit;

    const scaledFees: Eip1559Fee = {
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit,
    };

    this.opts.logger(`Scaling fees to ${JSON.stringify(scaledFees)}`);

    return scaledFees;
  }
}

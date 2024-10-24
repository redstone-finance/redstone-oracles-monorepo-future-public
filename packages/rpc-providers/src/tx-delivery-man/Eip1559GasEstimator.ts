import {
  getChainConfigByChainId,
  getLocalChainConfigs,
} from "@redstone-finance/chain-configs";
import { providers } from "ethers";
import { getProviderChainId } from "../common";
import { GasEstimator } from "./GasEstimator";
import { TxDeliveryOptsValidated, unsafeBnToNumber } from "./TxDelivery";

type FeeHistoryResponse = { reward: string[] };

export type Eip1559Fee = {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
};

export class Eip1559GasEstimator implements GasEstimator<Eip1559Fee> {
  constructor(readonly opts: TxDeliveryOptsValidated) {}

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

    return fee;
  }

  /**
   * Take value of percentileOfPriorityFee from last N blocks
   * And return maximal value from it
   * If returns 0 fallbacks to default, which is described per chain in chain-configs.json
   * if it is not defined for current chain, returns 0
   */
  private async estimatePriorityFee(
    provider: providers.JsonRpcProvider
  ): Promise<number> {
    const feeHistory = await this.getFeeHistory(provider, "pending");

    const rewardsPerBlockForPercentile = feeHistory.reward
      .flat()
      .map((hex: string) => parseInt(hex, 16));

    const maxRewardsPerBlockForPercentile = Math.max(
      ...rewardsPerBlockForPercentile
    );

    this.opts.logger(
      `Fetched rewardsPerBlockForPercentile: ${rewardsPerBlockForPercentile.toString()}, having max=${maxRewardsPerBlockForPercentile}`
    );

    if (maxRewardsPerBlockForPercentile !== 0) {
      return maxRewardsPerBlockForPercentile;
    }

    const chainId = await getProviderChainId(provider);

    const chainConfig = getChainConfigByChainId(
      getLocalChainConfigs(),
      chainId
    );

    if (chainConfig.fallbackToEthMaxPriorityFeePerGas) {
      const ethMaxPriorityFeePerGasResult = Number(
        await provider.send("eth_maxPriorityFeePerGas", [])
      );
      this.opts.logger(
        `Fallback to eth_maxPriorityFeePerGas=${ethMaxPriorityFeePerGasResult}  because maxRewardsPerBlockForPercentile=0`
      );
      return ethMaxPriorityFeePerGasResult;
    }

    return maxRewardsPerBlockForPercentile;
  }

  private async getFeeHistory(
    provider: providers.JsonRpcProvider,
    newestBlock: "pending" | "latest"
  ): Promise<FeeHistoryResponse> {
    return (await provider.send("eth_feeHistory", [
      "0x" + this.opts.numberOfBlocksForFeeHistory.toString(16),
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

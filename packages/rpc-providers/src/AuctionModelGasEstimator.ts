import { ethers } from "ethers";
import {
  TransactionDeliveryManOpts,
  unsafeBnToNumber,
} from "./TransactionDeliveryMan";
import { GasEstimator } from "./GasEstimator";

export type AuctionModelFee = {
  gasPrice: number;
  gasLimit: number;
};

export class AuctionModelGasEstimator implements GasEstimator<AuctionModelFee> {
  constructor(readonly opts: Required<TransactionDeliveryManOpts>) {}

  async getFees(
    provider: ethers.providers.JsonRpcProvider
  ): Promise<AuctionModelFee> {
    return {
      gasPrice: unsafeBnToNumber(await provider.getGasPrice()),
      gasLimit: this.opts.gasLimit,
    };
  }

  scaleFees(currentFees: AuctionModelFee, attempt: number): AuctionModelFee {
    const gasLimit = this.opts.twoDimensionFees
      ? Math.round(currentFees.gasLimit * this.opts.gasLimitMultiplier)
      : currentFees.gasLimit;

    const multipleBy = this.opts.multiplier ** attempt;
    const gasPrice = Math.round(currentFees.gasPrice * multipleBy);

    const scaledFees: AuctionModelFee = {
      gasLimit,
      gasPrice,
    };

    this.opts.logger(
      `Scaling fees (multiplier=${multipleBy}) to ${JSON.stringify(scaledFees)}`
    );

    return scaledFees;
  }
}

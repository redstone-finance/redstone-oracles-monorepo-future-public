import { ethers } from "ethers";
import { GasEstimator } from "./GasEstimator";
import {
  TransactionDeliveryManOptsValidated,
  unsafeBnToNumber,
} from "./TransactionDeliveryMan";

export type AuctionModelFee = {
  gasPrice: number;
};

export class AuctionModelGasEstimator implements GasEstimator<AuctionModelFee> {
  constructor(readonly opts: TransactionDeliveryManOptsValidated) {}

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getFees(
    provider: ethers.providers.JsonRpcProvider
  ): Promise<AuctionModelFee> {
    return {
      gasPrice: unsafeBnToNumber(await provider.getGasPrice()),
    };
  }

  scaleFees(currentFees: AuctionModelFee, attempt: number): AuctionModelFee {
    const multipleBy = this.opts.multiplier ** attempt;
    const gasPrice = Math.round(currentFees.gasPrice * multipleBy);

    const scaledFees: AuctionModelFee = {
      gasPrice,
    };

    this.opts.logger(
      `Scaling fees (multiplier=${multipleBy}) to ${JSON.stringify(scaledFees)}`
    );

    return scaledFees;
  }
}

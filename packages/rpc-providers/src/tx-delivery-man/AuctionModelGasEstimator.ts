import { ethers } from "ethers";
import { GasEstimator } from "./GasEstimator";
import { TxDeliveryOptsValidated, unsafeBnToNumber } from "./TxDelivery";

export type AuctionModelFee = {
  gasPrice: number;
};

export class AuctionModelGasEstimator implements GasEstimator<AuctionModelFee> {
  constructor(readonly opts: TxDeliveryOptsValidated) {}

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

    return scaledFees;
  }
}

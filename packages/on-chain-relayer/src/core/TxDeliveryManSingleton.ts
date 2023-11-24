import { TransactionDeliveryMan } from "@redstone-finance/rpc-providers";
import { config } from "../config";

let deliveryMan: TransactionDeliveryMan | undefined = undefined;
export const getTxDeliveryMan = () => {
  deliveryMan =
    deliveryMan ??
    new TransactionDeliveryMan({
      expectedDeliveryTimeMs: config().expectedTxDeliveryTimeInMS,
      gasLimit: config().gasLimit,
      twoDimensionFees: config().isArbitrumNetwork,
      multiplier: config().gasMultiplier,
      isAuctionModel: config().isAuctionModel,
    });
  return deliveryMan;
};

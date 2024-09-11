import {
  TxDeliveryMan,
  TxDeliveryManSupportedProviders,
  TxDeliverySigner,
} from "@redstone-finance/rpc-providers";
import { config } from "../config";

let deliveryMan: TxDeliveryMan | undefined = undefined;
export const getTxDeliveryMan = (
  signer: TxDeliverySigner,
  provider: TxDeliveryManSupportedProviders
) => {
  deliveryMan =
    deliveryMan ??
    new TxDeliveryMan(provider, signer, {
      expectedDeliveryTimeMs: config().expectedTxDeliveryTimeInMS,
      gasLimit: config().gasLimit,
      twoDimensionalFees: config().twoDimensionalFees,
      multiplier: config().gasMultiplier,
      maxAttempts: config().maxTxSendAttempts,
      isAuctionModel: config().isAuctionModel,
      forceDisableCustomGasOracle: config().disableCustomGasOracle,
    });
  return deliveryMan;
};

export const clearCachedTxDeliveryMan = () => {
  deliveryMan = undefined;
};

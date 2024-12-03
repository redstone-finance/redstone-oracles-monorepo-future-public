import { TransactionRequest } from "@ethersproject/providers";
import { PopulatedTransaction } from "ethers";

/**
 * All values have to resolve to hex values
 */
export type TxDeliveryCall = {
  from: string;
  to: string;
  data: string;
  value?: string;
};

export const convertToTxDeliveryCall = (
  transactionRequest: TransactionRequest | PopulatedTransaction
): TxDeliveryCall => ({
  from: transactionRequest.from as string,
  to: transactionRequest.to as string,
  data: transactionRequest.data as string,
});

/// needed to be extracted for Gelato
import {
  TransactionRequest,
  TransactionResponse,
} from "@ethersproject/providers";
import { PopulatedTransaction } from "ethers";

export const convertToTxDeliveryCall = (
  transactionRequest: TransactionRequest | PopulatedTransaction
): TxDeliveryCall => ({
  from: transactionRequest.from as string,
  to: transactionRequest.to as string,
  data: transactionRequest.data as string,
});

export type TxDeliveryCall = {
  from: string;
  to: string;
  data: string;
  value?: string;
};

export interface ITxDeliveryMan {
  deliver(
    txDeliveryCall: TxDeliveryCall,
    deferredCallData?: () => Promise<string>
  ): Promise<TransactionResponse | undefined>;
}

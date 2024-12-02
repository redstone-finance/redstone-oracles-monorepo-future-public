/// needed to be extracted for Gelato
import {
  TransactionRequest,
  TransactionResponse,
} from "@ethersproject/providers";
import { ContractParamsProvider } from "@redstone-finance/sdk";
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

// TODO: move it from here
export const SelfHandled = Symbol("SelfHandled");

export interface ITxDeliveryMan {
  deliver(
    txDeliveryCall: TxDeliveryCall,
    deferredCallData?: () => Promise<string>,
    paramsProvider?: ContractParamsProvider
  ): Promise<TransactionResponse | typeof SelfHandled>;
}

import { TxDeliveryCall } from "./TxDeliveryCall";

export interface TxDeliveryManContext {
  deferredCallData?: () => Promise<string>;
}

export interface ITxDeliveryMan {
  deliver(
    txDeliveryCall: TxDeliveryCall,
    context: TxDeliveryManContext
  ): Promise<unknown>;
}

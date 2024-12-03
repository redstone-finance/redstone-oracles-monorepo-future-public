import { ContractParamsProvider } from "@redstone-finance/sdk";
import { Tx } from "@redstone-finance/utils";

export type RelayerTxDeliveryManContext = Tx.TxDeliveryManContext & {
  paramsProvider: ContractParamsProvider;
};

import { ContractParamsProvider } from "@redstone-finance/sdk";
import { ContractData } from "../../types";

export interface IRedstoneContractAdapter {
  getUniqueSignerThreshold(blockNumber?: number): Promise<number>;

  readLatestRoundParamsFromContract(
    feedIds: string[],
    blockNumber: number
  ): Promise<ContractData>;

  writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<void>;
}

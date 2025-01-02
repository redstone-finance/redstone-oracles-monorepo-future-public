import { ContractParamsProvider } from "@redstone-finance/sdk";
import { ContractData } from "../../types";

export interface IRedstoneContractAdapter {
  getUniqueSignerThreshold(blockNumber?: number): Promise<number>;

  readLatestRoundContractData(
    feedIds: string[],
    blockNumber: number,
    withDataFeedValues: boolean
  ): Promise<ContractData>;

  writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<void>;
}

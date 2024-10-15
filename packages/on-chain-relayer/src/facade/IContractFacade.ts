import {
  ContractData,
  IterationArgs,
  RelayerConfig,
  UpdatePricesArgs,
} from "../types";

export interface IContractFacade {
  getIterationArgs(): Promise<IterationArgs>;

  getBlockNumber(): Promise<number>;

  getUniqueSignersThresholdFromContract(blockTag: number): Promise<number>;

  getLastRoundParamsFromContract(
    blockTag: number,
    relayerConfig: RelayerConfig
  ): Promise<ContractData>;

  addExtraFeedsToUpdateParams(
    iterationArgs: IterationArgs
  ): { message: string; args?: unknown[] }[];

  updatePrices(args: UpdatePricesArgs): Promise<void>;
}

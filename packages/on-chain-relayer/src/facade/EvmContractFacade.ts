import { Contract } from "ethers";
import { getUniqueSignersThresholdFromContract } from "../core/contract-interactions/get-unique-signers-threshold";
import {
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
  RelayerConfig,
  UpdatePricesArgs,
} from "../index";
import { ContractData, IterationArgs } from "../types";
import { IContractFacade } from "./IContractFacade";

type RedstoneEvmContract = Contract &
  (MultiFeedAdapterWithoutRounds | RedstoneAdapterBase);

export abstract class EvmContractFacade<C extends RedstoneEvmContract>
  implements IContractFacade
{
  constructor(
    protected readonly adapterContract: C,
    protected readonly updater?: (args: UpdatePricesArgs) => Promise<void>
  ) {}

  abstract getIterationArgs(): Promise<IterationArgs>;

  abstract getLastRoundParamsFromContract(
    blockTag: number,
    relayerConfig: RelayerConfig
  ): Promise<ContractData>;

  getUniqueSignersThresholdFromContract(blockTag: number): Promise<number> {
    return getUniqueSignersThresholdFromContract(
      this.adapterContract,
      blockTag
    );
  }

  getBlockNumber() {
    return this.adapterContract.provider.getBlockNumber();
  }

  addExtraFeedsToUpdateParams(
    _iterationArgs: IterationArgs
  ): { message: string; args?: unknown[] }[] {
    return [];
  }

  async updatePrices(args: UpdatePricesArgs): Promise<void> {
    if (!this.updater) {
      throw new Error("Updater not set!");
    }

    return await this.updater(args);
  }
}

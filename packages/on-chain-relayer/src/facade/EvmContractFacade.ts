import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import { Contract } from "ethers";
import { getUniqueSignersThresholdFromContract } from "../core/contract-interactions/get-unique-signers-threshold";
import {
  MultiFeedAdapterWithoutRounds,
  RedstoneAdapterBase,
  UpdatePricesArgs,
} from "../index";
import { IterationArgs } from "../types";
import { ContractFacade } from "./ContractFacade";

type RedstoneEvmContract = Contract &
  (MultiFeedAdapterWithoutRounds | RedstoneAdapterBase);

export abstract class EvmContractFacade<
  C extends RedstoneEvmContract,
> extends ContractFacade {
  constructor(
    protected readonly adapterContract: C,
    protected readonly updater?: (args: UpdatePricesArgs) => Promise<void>,
    cache?: DataPackagesResponseCache
  ) {
    super(cache);
  }

  getUniqueSignersThresholdFromContract(blockTag: number): Promise<number> {
    return getUniqueSignersThresholdFromContract(
      this.adapterContract,
      blockTag
    );
  }

  getBlockNumber() {
    return this.adapterContract.provider.getBlockNumber();
  }

  override addExtraFeedsToUpdateParams(
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

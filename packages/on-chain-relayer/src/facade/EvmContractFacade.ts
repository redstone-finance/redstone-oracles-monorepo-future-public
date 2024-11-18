import { Contract } from "ethers";
import { IRedstoneContractAdapter } from "../core/contract-interactions/IRedstoneContractAdapter";
import { MultiFeedAdapterWithoutRounds, RedstoneAdapterBase } from "../index";
import { ContractData } from "../types";
import { ContractFacade } from "./ContractFacade";

export type RedstoneEvmContract = Contract &
  (MultiFeedAdapterWithoutRounds | RedstoneAdapterBase);

export class EvmContractFacade extends ContractFacade {
  async getLastRoundParamsFromContract(
    feedIds: string[],
    blockTag: number
  ): Promise<ContractData> {
    return await (
      await this.getAdapter()
    ).readLatestRoundParamsFromContract(feedIds, blockTag);
  }

  private async getAdapter() {
    return (await this.connector.getAdapter()) as IRedstoneContractAdapter;
  }
}

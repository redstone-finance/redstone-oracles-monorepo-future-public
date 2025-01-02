import { Contract } from "ethers";
import { IRedstoneContractAdapter } from "../core/contract-interactions/IRedstoneContractAdapter";
import { MultiFeedAdapterWithoutRounds, RedstoneAdapterBase } from "../index";
import { ContractData } from "../types";
import { ContractFacade } from "./ContractFacade";

export type RedstoneEvmContract = Contract &
  (MultiFeedAdapterWithoutRounds | RedstoneAdapterBase);

export class EvmContractFacade extends ContractFacade {
  async getLatestRoundContractData(
    feedIds: string[],
    blockTag: number,
    withDataFeedValues: boolean
  ): Promise<ContractData> {
    return await (
      await this.getAdapter()
    ).readLatestRoundContractData(feedIds, blockTag, withDataFeedValues);
  }

  private async getAdapter() {
    return (await this.connector.getAdapter()) as IRedstoneContractAdapter;
  }
}

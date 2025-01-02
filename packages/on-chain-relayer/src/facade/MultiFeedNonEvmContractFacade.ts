import { IMultiFeedPricesContractAdapter } from "@redstone-finance/sdk";
import { ContractData } from "../types";
import { ContractFacade } from "./ContractFacade";

export class MultiFeedNonEvmContractFacade extends ContractFacade {
  async getLatestRoundContractData(
    feedIds: string[],
    blockTag: number
  ): Promise<ContractData> {
    const adapter = await this.getAdapter();

    return await adapter.readContractData(feedIds, blockTag);
  }

  private async getAdapter() {
    return (await this.connector.getAdapter()) as IMultiFeedPricesContractAdapter;
  }
}

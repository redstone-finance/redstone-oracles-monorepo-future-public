import {
  ContractParamsProvider,
  DataPackagesRequestParams,
  IExtendedPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumber } from "ethers";
import { zip } from "lodash";
import { ContractData } from "../types";
import { ContractFacade } from "./ContractFacade";

export class NonEvmContractFacade extends ContractFacade {
  async getLatestRoundContractData(
    feedIds: string[],
    _blockTag: number
  ): Promise<ContractData> {
    const adapter = await this.getAdapter();

    return await getContractDataFromExtendedPricesContractAdapter(
      adapter,
      feedIds
    );
  }

  private async getAdapter() {
    return (await this.connector.getAdapter()) as IExtendedPricesContractAdapter;
  }
}

async function getContractDataFromExtendedPricesContractAdapter(
  adapter: IExtendedPricesContractAdapter,
  feedIds: string[]
) {
  const [timestamp, latestUpdateBlockTimestamp, prices] = await Promise.all([
    await adapter.readTimestampFromContract(),
    await adapter.readLatestUpdateBlockTimestamp(),
    await adapter.readPricesFromContract(
      new ContractParamsProvider({
        dataPackagesIds: feedIds,
      } as unknown as DataPackagesRequestParams) //TODO: [LK] change readPricesFromContract to reading only with (feedIds: string[])
    ),
  ]);

  const entries = zip(feedIds, prices).map(([feedId, price]) => [
    feedId,
    {
      lastDataPackageTimestampMS: timestamp,
      lastBlockTimestampMS: latestUpdateBlockTimestamp ?? timestamp,
      lastValue: BigNumber.from(price),
    },
  ]);

  return Object.fromEntries(entries) as ContractData;
}

import {
  ContractData,
  ContractParamsProvider,
  IMultiFeedPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumber, BigNumberish, utils } from "ethers";
import _ from "lodash";
import { PriceAdapterRadixContractAdapter } from "../price_adapter/PriceAdapterRadixContractAdapter";
import { ReadPricesRadixMethod } from "../price_adapter/methods/ReadPricesRadixMethod";
import { ReadTimestampRadixMethod } from "../price_adapter/methods/ReadTimestampRadixMethod";
import { ReadPriceDataRadixMethod } from "./methods/ReadPriceDataRadixMethod";

export class MultiFeedPriceAdapterRadixContractAdapter
  extends PriceAdapterRadixContractAdapter
  implements IMultiFeedPricesContractAdapter
{
  override async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ) {
    if (this.readMode === "ReadFromStorage") {
      const priceData = await this.readPriceData();

      return paramsProvider
        .getDataFeedIds()
        .map((feedId) => priceData[feedId].lastValue);
    } else {
      return await this.client.call(
        new ReadPricesRadixMethod(
          this.componentId,
          paramsProvider.getDataFeedIds()
        )
      );
    }
  }

  override async readTimestampFromContract(feedId?: string) {
    if (this.readMode === "ReadFromStorage") {
      const priceData = await this.readPriceData();

      return Number(priceData[feedId!].lastDataPackageTimestampMS);
    } else {
      return Number(
        await this.client.call(
          new ReadTimestampRadixMethod(this.componentId, feedId)
        )
      );
    }
  }

  override async readLatestUpdateBlockTimestamp(
    feedId?: string
  ): Promise<number | undefined> {
    const priceData = await this.readPriceData();

    return priceData[feedId!].lastBlockTimestampMS;
  }

  async readContractData(feedIds: string[]): Promise<ContractData> {
    if (this.readMode === "ReadFromStorage") {
      const priceData = await this.readPriceData();

      return _.pick(priceData, feedIds);
    } else {
      const priceData = await this.client.call(
        new ReadPriceDataRadixMethod(this.componentId, feedIds)
      );

      return Object.fromEntries(
        _.zip(
          feedIds,
          priceData.map(
            MultiFeedPriceAdapterRadixContractAdapter.convertRawToLastDetails
          )
        )
      ) as ContractData;
    }
  }

  private async readPriceData(): Promise<ContractData> {
    const priceMap: {
      [p: string]: [BigNumberish, BigNumberish, BigNumberish];
    } = await this.client.readValue(this.componentId, "prices");

    return Object.fromEntries(
      Object.entries(priceMap).map(([feedId, data]) => [
        utils.toUtf8String(feedId),
        MultiFeedPriceAdapterRadixContractAdapter.convertRawToLastDetails(data),
      ])
    );
  }

  static convertRawToLastDetails(
    data: [BigNumberish, BigNumberish, BigNumberish]
  ) {
    return {
      lastDataPackageTimestampMS: Number(data[2]),
      lastBlockTimestampMS: Number(data[1]),
      lastValue: BigNumber.from(data[0]),
    };
  }
}

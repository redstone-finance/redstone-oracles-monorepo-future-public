import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  ContractParamsProvider,
  getDataPackagesTimestamp,
  ValuesForDataFeeds,
} from "@redstone-finance/sdk";
import { RedstoneCommon, Tx } from "@redstone-finance/utils";
import { BigNumber, utils } from "ethers";
import { RedstoneAdapterBase } from "../../../typechain-types";
import { ContractData } from "../../types";
import { EvmContractAdapter } from "./EvmContractAdapter";
import { getLatestTimestampsFromContract } from "./get-latest-timestamps-from-contract";

export class PriceFeedsEvmContractAdapter<
  Contract extends RedstoneAdapterBase,
> extends EvmContractAdapter<Contract> {
  override async makeUpdateTx(
    paramsProvider: ContractParamsProvider,
    metadataTimestamp: number
  ): Promise<Tx.TxDeliveryCall> {
    const dataPackages = await paramsProvider.requestDataPackages();
    const dataPackagesWrapper = new DataPackagesWrapper<RedstoneAdapterBase>(
      dataPackages
    );
    const proposedTimestamp = getDataPackagesTimestamp(dataPackages);

    dataPackagesWrapper.setMetadataTimestamp(metadataTimestamp);
    const wrappedContract = dataPackagesWrapper.overwriteEthersContract(
      this.adapterContract
    );

    const txCall = Tx.convertToTxDeliveryCall(
      await wrappedContract.populateTransaction["updateDataFeedsValues"](
        proposedTimestamp
      )
    );

    return txCall;
  }

  override async readLatestRoundContractData(
    feedIds: string[],
    blockNumber: number,
    withDataFeedValues: boolean
  ): Promise<ContractData> {
    const { lastUpdateTimestamps, valuesFromContract } =
      await RedstoneCommon.waitForAllRecord({
        lastUpdateTimestamps: getLatestTimestampsFromContract(
          this.adapterContract,
          blockNumber
        ),
        valuesFromContract: withDataFeedValues
          ? this.getValuesForDataFeeds(feedIds, blockNumber)
          : Promise.resolve({} as ValuesForDataFeeds),
      });
    const { lastBlockTimestampMS, lastDataPackageTimestampMS } =
      lastUpdateTimestamps;
    const lastRoundParams: ContractData = {};
    for (const dataFeedId of feedIds) {
      lastRoundParams[dataFeedId] = {
        lastBlockTimestampMS,
        lastDataPackageTimestampMS,
        lastValue: valuesFromContract[dataFeedId] ?? BigNumber.from(0),
      };
    }

    return lastRoundParams;
  }

  async getValuesForDataFeeds(dataFeeds: string[], blockTag: number) {
    const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
    const valuesFromContractAsBigNumber =
      await this.adapterContract.getValuesForDataFeeds(dataFeedsAsBytes32, {
        blockTag,
      });
    const dataFeedsValues: ValuesForDataFeeds = {};
    for (const [index, dataFeedId] of dataFeeds.entries()) {
      dataFeedsValues[dataFeedId] = valuesFromContractAsBigNumber[index];
    }
    return dataFeedsValues;
  }
}

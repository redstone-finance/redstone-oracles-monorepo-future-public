import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import { ContractParamsProvider, isSubsetOf } from "@redstone-finance/sdk";
import { loggerFactory, Tx } from "@redstone-finance/utils";
import { utils } from "ethers";
import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { ContractData, LastRoundDetails } from "../../types";
import { EvmContractAdapter } from "./EvmContractAdapter";

const logger = loggerFactory("updatePrices/multi-feed");

export class MultiFeedEvmContractAdapter extends EvmContractAdapter<MultiFeedAdapterWithoutRounds> {
  async makeUpdateTx(
    paramsProvider: ContractParamsProvider,
    metadataTimestamp: number
  ): Promise<Tx.TxDeliveryCall> {
    const dataFeedsToUpdate = paramsProvider.getDataFeedIds();
    let dataFeedsAsBytes32 = dataFeedsToUpdate.map(utils.formatBytes32String);
    const dataPackages = await paramsProvider.requestDataPackages();
    const dataPackagesFeeds = Object.keys(dataPackages);

    //TODO: Multifeed won't work with medium data packages.
    if (!isSubsetOf(new Set(dataPackagesFeeds), new Set(dataFeedsToUpdate))) {
      logger.log(
        `Missing some feeds in the response, will update only for [${dataPackagesFeeds.toString()}]`,
        {
          dataFeedsToUpdate,
          dataPackagesFeeds,
        }
      );

      dataFeedsAsBytes32 = dataPackagesFeeds.map(utils.formatBytes32String);
    }

    const dataPackagesWrapper =
      new DataPackagesWrapper<MultiFeedAdapterWithoutRounds>(dataPackages);

    dataPackagesWrapper.setMetadataTimestamp(metadataTimestamp);
    const wrappedContract = dataPackagesWrapper.overwriteEthersContract(
      this.adapterContract
    );

    const txCall = Tx.convertToTxDeliveryCall(
      await wrappedContract.populateTransaction["updateDataFeedsValuesPartial"](
        dataFeedsAsBytes32
      )
    );

    return txCall;
  }

  override async readLatestRoundContractData(
    feedIds: string[],
    blockNumber: number
  ): Promise<ContractData> {
    const dataFromContract: ContractData = {};

    const lastRoundDetails = await this.getLastUpdateDetailsForManyFromContract(
      feedIds,
      blockNumber
    );

    for (const [index, dataFeedId] of feedIds.entries()) {
      dataFromContract[dataFeedId] = lastRoundDetails[index];
    }

    return dataFromContract;
  }

  private getLastUpdateDetailsForManyFromContract = async (
    feedIds: string[],
    blockNumber: number
  ): Promise<LastRoundDetails[]> => {
    const dataFeedsAsBytes32 = feedIds.map(utils.formatBytes32String);
    const contractOutput: MultiFeedAdapterWithoutRounds.LastUpdateDetailsStructOutput[] =
      await this.adapterContract.getLastUpdateDetailsUnsafeForMany(
        dataFeedsAsBytes32,
        {
          blockTag: blockNumber,
        }
      );

    return contractOutput.map((lastRoundDetails) => ({
      lastDataPackageTimestampMS: lastRoundDetails.dataTimestamp.toNumber(),
      lastBlockTimestampMS: lastRoundDetails.blockTimestamp.toNumber() * 1000,
      lastValue: lastRoundDetails.value,
    }));
  };
}

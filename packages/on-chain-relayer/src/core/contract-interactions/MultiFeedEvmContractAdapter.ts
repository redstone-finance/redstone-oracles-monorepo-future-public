import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import { ContractParamsProvider, isSubsetOf } from "@redstone-finance/sdk";
import { loggerFactory } from "@redstone-finance/utils";
import { utils } from "ethers";
import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { getLastRoundParamsFromContractMultiFeed } from "../../multi-feed/args/get-last-round-params";
import { ContractData } from "../../types";
import { EvmContractAdapter } from "./EvmContractAdapter";
import {
  convertToTxDeliveryCall,
  TxDeliveryCall,
} from "./tx-delivery-gelato-bypass";

const logger = loggerFactory("updatePrices/multi-feed");

export class MultiFeedEvmContractAdapter extends EvmContractAdapter<MultiFeedAdapterWithoutRounds> {
  async makeUpdateTx(
    paramsProvider: ContractParamsProvider,
    metadataTimestamp: number
  ): Promise<TxDeliveryCall> {
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

    const txCall = convertToTxDeliveryCall(
      await wrappedContract.populateTransaction["updateDataFeedsValuesPartial"](
        dataFeedsAsBytes32
      )
    );

    return txCall;
  }

  override async readLatestRoundParamsFromContract(
    feedIds: string[],
    blockNumber: number
  ): Promise<ContractData> {
    return await getLastRoundParamsFromContractMultiFeed(
      this.adapterContract,
      feedIds,
      blockNumber
    );
  }
}

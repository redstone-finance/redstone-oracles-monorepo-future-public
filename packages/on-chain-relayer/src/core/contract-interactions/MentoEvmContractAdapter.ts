import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  chooseDataPackagesTimestamp,
  ContractParamsProvider,
  ValuesForDataFeeds,
} from "@redstone-finance/sdk";
import { MentoAdapterBase } from "../../../typechain-types";
import { getSortedOraclesContractAtAddress } from "../../custom-integrations/mento/get-sorted-oracles-contract-at-address";
import {
  getValuesForMentoDataFeeds,
  prepareLinkedListLocationsForMentoAdapterReport,
} from "../../custom-integrations/mento/mento-utils";
import { PriceFeedsEvmContractAdapter } from "./PriceFeedsEvmContractAdapter";
import { convertToTxDeliveryCall } from "./tx-delivery-gelato-bypass";

export class MentoEvmContractAdapter extends PriceFeedsEvmContractAdapter<MentoAdapterBase> {
  override async getValuesForDataFeeds(
    dataFeeds: string[],
    blockTag: number
  ): Promise<ValuesForDataFeeds> {
    const sortedOraclesAddress = await this.adapterContract.getSortedOracles({
      blockTag,
    });
    return await getValuesForMentoDataFeeds(
      this.adapterContract,
      getSortedOraclesContractAtAddress(
        sortedOraclesAddress,
        this.adapterContract.provider
      ),
      dataFeeds,
      blockTag
    );
  }

  override async makeUpdateTx(
    paramsProvider: ContractParamsProvider,
    metadataTimestamp: number
  ) {
    const dataPackagesPromise = paramsProvider.requestDataPackages();
    const blockTag = await this.adapterContract.provider.getBlockNumber();

    const sortedOraclesAddress = await this.adapterContract.getSortedOracles({
      blockTag,
    });
    const sortedOracles = getSortedOraclesContractAtAddress(
      sortedOraclesAddress,
      this.adapterContract.provider
    );
    const maxDeviationAllowed = this.relayerConfig.mentoMaxDeviationAllowed;

    const dataPackages = await dataPackagesPromise;
    const dataPackagesWrapper = new DataPackagesWrapper<MentoAdapterBase>(
      dataPackages
    );

    const linkedListPositions =
      await prepareLinkedListLocationsForMentoAdapterReport(
        {
          mentoAdapter: this.adapterContract,
          dataPackagesWrapper,
          sortedOracles,
        },
        blockTag,
        maxDeviationAllowed
      );
    if (!linkedListPositions) {
      throw new Error(
        `Prices in Sorted Oracles deviated more than ${maxDeviationAllowed}% from RedStone prices`
      );
    }

    dataPackagesWrapper.setMetadataTimestamp(metadataTimestamp);
    const wrappedMentoContract = dataPackagesWrapper.overwriteEthersContract(
      this.adapterContract
    );

    const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);

    const txCall = convertToTxDeliveryCall(
      await wrappedMentoContract.populateTransaction[
        "updatePriceValuesAndCleanOldReports"
      ](proposedTimestamp, linkedListPositions)
    );

    return txCall;
  }
}

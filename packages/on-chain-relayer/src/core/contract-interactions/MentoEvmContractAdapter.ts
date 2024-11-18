import { DataPackagesWrapper } from "@redstone-finance/evm-connector";
import {
  chooseDataPackagesTimestamp,
  ContractParamsProvider,
  ValuesForDataFeeds,
} from "@redstone-finance/sdk";
import { MentoAdapterBase } from "../../../typechain-types";
import { config } from "../../config";
import { getSortedOraclesContractAtAddress } from "../../custom-integrations/mento/get-sorted-oracles-contract-at-address";
import {
  getValuesForMentoDataFeeds,
  prepareLinkedListLocationsForMentoAdapterReport,
} from "../../custom-integrations/mento/mento-utils";
import { PriceFeedsEvmContractAdapter } from "./PriceFeedsEvmContractAdapter";
import {
  convertToTxDeliveryCall,
  TxDeliveryCall,
} from "./tx-delivery-gelato-fixes";

export class MentoEvmContractAdapter extends PriceFeedsEvmContractAdapter<MentoAdapterBase> {
  override async makeUpdateTx(paramsProvider: ContractParamsProvider) {
    return await makeMentoUpdateTx(paramsProvider, this.adapterContract);
  }

  override async getValuesForDataFeeds(
    dataFeeds: string[],
    blockTag: number
  ): Promise<ValuesForDataFeeds> {
    return await getValuesForDataFeedsInMentoAdapter(
      this.adapterContract,
      dataFeeds,
      blockTag
    );
  }
}

const makeMentoUpdateTx = async (
  paramsProvider: ContractParamsProvider,
  mentoAdapter: MentoAdapterBase
): Promise<TxDeliveryCall> => {
  const dataPackagesPromise = paramsProvider.requestDataPackages();
  const blockTag = await mentoAdapter.provider.getBlockNumber();

  const sortedOraclesAddress = await mentoAdapter.getSortedOracles({
    blockTag,
  });
  const sortedOracles = getSortedOraclesContractAtAddress(
    sortedOraclesAddress,
    mentoAdapter.provider
  );
  const maxDeviationAllowed = config().mentoMaxDeviationAllowed;

  const dataPackages = await dataPackagesPromise;
  const dataPackagesWrapper = new DataPackagesWrapper<MentoAdapterBase>(
    dataPackages
  );

  const linkedListPositions =
    await prepareLinkedListLocationsForMentoAdapterReport(
      {
        mentoAdapter,
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

  dataPackagesWrapper.setMetadataTimestamp(Date.now());
  const wrappedMentoContract =
    dataPackagesWrapper.overwriteEthersContract(mentoAdapter);

  const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);

  const txCall = convertToTxDeliveryCall(
    await wrappedMentoContract.populateTransaction[
      "updatePriceValuesAndCleanOldReports"
    ](proposedTimestamp, linkedListPositions)
  );

  return txCall;
};

const getValuesForDataFeedsInMentoAdapter = async (
  mentoAdapter: MentoAdapterBase,
  dataFeeds: string[],
  blockTag: number
): Promise<ValuesForDataFeeds> => {
  const sortedOraclesAddress = await mentoAdapter.getSortedOracles({
    blockTag,
  });
  return await getValuesForMentoDataFeeds(
    mentoAdapter,
    getSortedOraclesContractAtAddress(
      sortedOraclesAddress,
      mentoAdapter.provider
    ),
    dataFeeds,
    blockTag
  );
};

import { TransactionResponse } from "@ethersproject/providers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { Contract } from "ethers";
import { DataPackagesResponse } from "redstone-sdk";
import { config } from "../../config";
import {
  MentoContracts,
  prepareLinkedListLocationsForMentoAdapterReport,
} from "../../custom-integrations/mento/mento-utils";

import { getSortedOraclesContractAtAddress } from "./get-contract";

interface UpdatePricesArgs {
  adapterContract: Contract;
  wrappedAdapterContract: Contract;
  proposedRound: number;
  proposedTimestamp: number;
}

const TX_CONFIG = { gasLimit: config.gasLimit };

export const updatePrices = async (
  dataPackages: DataPackagesResponse,
  adapterContract: Contract,
  lastUpdateTimestamp: number,
  lastRound: number
): Promise<void> => {
  const dataPackagesTimestamps = Object.values(dataPackages).flatMap(
    (dataPackages) =>
      dataPackages.map(
        (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
      )
  );
  const minimalTimestamp = Math.min(...dataPackagesTimestamps);

  if (lastUpdateTimestamp >= minimalTimestamp) {
    console.log("Cannot update prices, proposed prices are not newer");
  } else {
    const wrappedAdapterContract =
      WrapperBuilder.wrap(adapterContract).usingDataPackages(dataPackages);
    const updateTx = await updatePriceInAdapterContract({
      adapterContract,
      wrappedAdapterContract,
      proposedTimestamp: minimalTimestamp,
      proposedRound: lastRound + 1,
    });
    console.log(`Update prices tx sent: ${updateTx.hash}`);
    await updateTx.wait();
    console.log(`Successfully updated prices: ${updateTx.hash}`);
  }
};

const updatePriceInAdapterContract = async (
  args: UpdatePricesArgs
): Promise<TransactionResponse> => {
  switch (config.adapterContractType) {
    case "price-feeds":
      return await updatePricesInPriceFeedsAdapter(args);
    case "mento":
      return await updatePricesInMentoAdapter(args);
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config.adapterContractType}`
      );
  }
};

const updatePricesInPriceFeedsAdapter = async ({
  wrappedAdapterContract,
  proposedRound,
  proposedTimestamp,
}: UpdatePricesArgs): Promise<TransactionResponse> => {
  return await wrappedAdapterContract.updateDataFeedsValues(
    proposedRound,
    proposedTimestamp,
    TX_CONFIG
  );
};

const updatePricesInMentoAdapter = async ({
  adapterContract,
  wrappedAdapterContract,
  proposedRound,
  proposedTimestamp,
}: UpdatePricesArgs): Promise<TransactionResponse> => {
  const sortedOraclesAddress = await adapterContract.sortedOracles();
  const sortedOracles = getSortedOraclesContractAtAddress(sortedOraclesAddress);
  const linkedListPositions =
    await prepareLinkedListLocationsForMentoAdapterReport({
      mentoAdapter: adapterContract,
      wrappedMentoAdapter: wrappedAdapterContract,
      sortedOracles,
    } as MentoContracts);
  return await wrappedAdapterContract.updatePriceValuesAndCleanOldReports(
    proposedRound,
    proposedTimestamp,
    linkedListPositions
  );
};

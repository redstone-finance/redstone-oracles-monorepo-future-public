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
import { TransactionDeliveryMan } from "redstone-rpc-providers";

interface UpdatePricesArgs {
  adapterContract: Contract;
  wrapContract(adapterContract: Contract): Contract;
  proposedTimestamp: number;
}

const deliveryMan = new TransactionDeliveryMan({
  expectedDeliveryTimeMs: config.expectedTxDeliveryTimeInMS,
  gasLimit: config.gasLimit,
  twoDimensionFees: config.isArbitrumNetwork,
});

export const updatePrices = async (
  dataPackages: DataPackagesResponse,
  adapterContract: Contract,
  lastUpdateTimestamp: number
): Promise<void> => {
  const dataPackagesTimestamps = Object.values(dataPackages).flatMap(
    (dataPackages) =>
      dataPackages.map(
        (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
      )
  );
  const minimalTimestamp = Math.min(...dataPackagesTimestamps);

  if (lastUpdateTimestamp >= minimalTimestamp) {
    console.log(
      `Cannot update prices, proposed prices are not newer ${JSON.stringify({
        lastUpdateTimestamp,
        dataPackageTimestamp: minimalTimestamp,
      })}`
    );
  } else {
    const wrapContract = (adapterContract: Contract) =>
      WrapperBuilder.wrap(adapterContract).usingDataPackages(dataPackages);
    const updateTx = await updatePriceInAdapterContract({
      adapterContract,
      wrapContract,
      proposedTimestamp: minimalTimestamp,
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
  adapterContract,
  wrapContract,
  proposedTimestamp,
}: UpdatePricesArgs): Promise<TransactionResponse> => {
  const wrappedContract = wrapContract(adapterContract);

  const deliveryResult = await deliveryMan.deliver(
    wrappedContract,
    "updateDataFeedsValues",
    [proposedTimestamp]
  );

  return deliveryResult;
};

const updatePricesInMentoAdapter = async ({
  adapterContract,
  wrapContract,
  proposedTimestamp,
}: UpdatePricesArgs): Promise<TransactionResponse> => {
  const sortedOraclesAddress = await adapterContract.sortedOracles();
  const sortedOracles = getSortedOraclesContractAtAddress(sortedOraclesAddress);
  const linkedListPositions =
    await prepareLinkedListLocationsForMentoAdapterReport({
      mentoAdapter: adapterContract,
      wrapContract,
      sortedOracles,
    } as MentoContracts);
  return await wrapContract(
    adapterContract
  ).updatePriceValuesAndCleanOldReports(proposedTimestamp, linkedListPositions);
};

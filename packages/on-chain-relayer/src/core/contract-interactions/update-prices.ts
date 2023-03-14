import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { Contract } from "ethers";
import { DataPackagesResponse } from "redstone-sdk";
import { config } from "../../config";

export const updatePrices = async (
  dataPackages: DataPackagesResponse,
  priceFeedsAdapterContract: Contract,
  lastUpdateTimestamp: number,
  lastRound: number
) => {
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
    const wrappedContract = WrapperBuilder.wrap(
      priceFeedsAdapterContract
    ).usingDataPackages(dataPackages);

    const { gasLimit } = config;
    const updateTransaction = await wrappedContract.updateDataFeedsValues(
      lastRound + 1,
      minimalTimestamp,
      {
        gasLimit,
      }
    );
    await updateTransaction.wait();
    console.log("Successfully updated prices");
  }
};

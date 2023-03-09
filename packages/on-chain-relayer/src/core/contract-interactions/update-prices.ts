import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { Contract } from "ethers";
import { requestDataPackages } from "redstone-sdk";
import { config } from "../../config";

export const updatePrices = async (
  priceFeedsManagerContract: Contract,
  lastUpdateTimestamp: number,
  lastRound: number
) => {
  const {
    dataServiceId,
    uniqueSignersCount,
    dataFeeds,
    cacheServiceUrls,
    gasLimit,
  } = config;

  const dataPackages = await requestDataPackages(
    {
      dataServiceId,
      uniqueSignersCount,
      dataFeeds,
    },
    cacheServiceUrls
  );

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
      priceFeedsManagerContract
    ).usingDataPackages(dataPackages);

    const updateTransaction = await wrappedContract.updateDataFeedValues(
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

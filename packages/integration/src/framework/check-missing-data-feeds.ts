import { consts } from "@redstone-finance/protocol";
import { DataPackagesFromLocalAndProd } from "./run-long-price-propagation-core-test";

export const checkMissingDataFeeds = (
  { dataPackagesFromLocal, dataPackagesFromProd }: DataPackagesFromLocalAndProd,
  removedDataFeeds?: string[],
  dataFeedsNotWorkingLocally?: string[]
) => {
  const dataFeedsFromLocal = Object.keys(dataPackagesFromLocal);
  const dataFeedsFromProd = Object.keys(dataPackagesFromProd);

  const missingDataPackagesInLocal = getMissingDataFeedsInDataPackages(
    dataFeedsFromProd,
    dataFeedsFromLocal,
    removedDataFeeds,
    dataFeedsNotWorkingLocally
  );
  if (missingDataPackagesInLocal.length > 0) {
    throw new Error(
      `Missing data packages data package from local cache service: ${missingDataPackagesInLocal.join(
        ","
      )}`
    );
  }

  const missingDataPackagesInProd = getMissingDataFeedsInDataPackages(
    dataFeedsFromLocal,
    dataFeedsFromProd
  );
  console.warn(
    `Missing data packages data package from prod cache service: ${missingDataPackagesInProd.join(
      ","
    )}`
  );
};

const getMissingDataFeedsInDataPackages = (
  dataFeedsFromFirstDataPackage: string[],
  dataFeedsFromSecondDataPackage: string[],
  removedDataFeeds?: string[],
  dataFeedsNotWorkingLocally?: string[]
) =>
  dataFeedsFromFirstDataPackage.filter(
    (dataFeed) =>
      !dataFeedsFromSecondDataPackage.includes(dataFeed) &&
      dataFeed !== consts.ALL_FEEDS_KEY &&
      !removedDataFeeds?.includes(dataFeed) &&
      !dataFeedsNotWorkingLocally?.includes(dataFeed)
  );

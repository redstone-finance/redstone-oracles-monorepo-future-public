import { DataPackagesResponse } from "@redstone-finance/sdk";
import { Context } from "../types";

export const checkIfDataPackageTimestampIsNewer = (
  dataFeedId: string,
  context: Context
) => {
  const { dataPackages } = context;
  const lastDataPackageTimestampMS =
    context.dataFromContract[dataFeedId].lastDataTimestamp;

  const dataPackageTimestamp = chooseDataPackagesTimestamp(
    dataFeedId,
    dataPackages
  );

  if (lastDataPackageTimestampMS >= dataPackageTimestamp) {
    const message = `Cannot update prices, proposed prices are not newer ${JSON.stringify(
      {
        lastDataPackageTimestampMS,
        dataPackageTimestamp,
      }
    )}`;
    return { shouldNotUpdatePrice: true, message };
  }

  return { shouldNotUpdatePrice: false };
};

export const chooseDataPackagesTimestamp = (
  dataFeedId: string,
  dataPackages: DataPackagesResponse
) => {
  const dataPackageTimestamps = dataPackages[dataFeedId]!.flatMap(
    (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
  );

  return Math.min(...dataPackageTimestamps);
};

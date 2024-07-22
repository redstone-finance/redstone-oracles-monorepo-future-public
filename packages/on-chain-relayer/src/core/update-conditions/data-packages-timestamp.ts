import { DataPackagesResponse } from "@redstone-finance/sdk";
import { Context } from "../../types";

export const checkIfDataPackageTimestampIsNewer = (
  context: Context,
  dataFeedId: string
) => {
  const { dataPackages } = context;
  const lastDataPackageTimestampMS =
    context.dataFromContract[dataFeedId].lastDataPackageTimestampMS;

  const dataPackageTimestamp = chooseDataPackagesTimestamp(
    dataPackages,
    dataFeedId
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
  dataPackages: DataPackagesResponse,
  dataFeedId?: string
) => {
  const dataPackageTimestamps = dataFeedId
    ? dataPackages[dataFeedId]!.flatMap(
        (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
      )
    : Object.values(dataPackages).flatMap((dataPackages) =>
        dataPackages!.map(
          (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
        )
      );
  return Math.min(...dataPackageTimestamps);
};

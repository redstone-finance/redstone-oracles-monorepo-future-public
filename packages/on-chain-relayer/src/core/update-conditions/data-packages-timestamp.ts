import { DataPackagesResponse } from "@redstone-finance/sdk";
import { Context } from "../../types";

export const checkIfDataPackageTimestampIsNewer = (context: Context) => {
  const {
    dataPackages,
    lastUpdateTimestamps: { lastDataPackageTimestampMS },
  } = context;

  const dataPackageTimestamp = chooseDataPackagesTimestamp(dataPackages);

  if (lastDataPackageTimestampMS >= dataPackageTimestamp) {
    const message = `Cannot update prices, proposed prices are not newer ${JSON.stringify(
      {
        lastDataPackageTimestampMS,
        dataPackageTimestamp: dataPackageTimestamp,
      }
    )}`;
    return { shouldNotUpdatePrice: true, message };
  }

  return { shouldNotUpdatePrice: false };
};

export const chooseDataPackagesTimestamp = (
  dataPackages: DataPackagesResponse
) => {
  const dataPackageTimestamps = Object.values(dataPackages).flatMap(
    (dataPackages) =>
      dataPackages.map(
        (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
      )
  );
  return Math.min(...dataPackageTimestamps);
};

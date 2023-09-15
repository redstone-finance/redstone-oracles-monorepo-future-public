import { mockSignedDataPackageObjects } from "../tests-common";
import { SignedDataPackage } from "@redstone-finance/protocol";

const singedDataPackageObj = mockSignedDataPackageObjects;

const getDataPackageResponse = (dataFeedId: string) =>
  singedDataPackageObj
    .filter(
      (dataPackage) =>
        dataPackage.dataPoints.filter((dp) => dp.dataFeedId === dataFeedId)
          .length > 0
    )
    .map((dataPackage) => SignedDataPackage.fromObj(dataPackage));

export const getValidDataPackagesResponse = () => ({
  ETH: getDataPackageResponse("ETH"),
  BTC: getDataPackageResponse("BTC"),
});

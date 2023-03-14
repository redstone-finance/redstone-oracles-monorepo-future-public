import { INumericDataPoint } from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";
import { config } from "../../config";
import { ValuesForDataFeeds } from "../../types";

export const valueDeviationCondition = (
  dataPackages: DataPackagesResponse,
  valuesFromContract: ValuesForDataFeeds
) => {
  const dataFeedsIds = Object.keys(dataPackages);

  let maxDeviation = 0;
  for (const dataFeedId of dataFeedsIds) {
    for (const { dataPackage } of dataPackages[dataFeedId]) {
      for (const dataPoint of dataPackage.dataPoints) {
        const valueFromContract = valuesFromContract[dataFeedId];
        const valueFromFetchedDataPackage = (
          dataPoint.toObj() as INumericDataPoint
        ).value;
        const currentDeviation = calculateDeviation(
          valueFromFetchedDataPackage,
          valueFromContract
        );
        maxDeviation = Math.max(currentDeviation, maxDeviation);
      }
    }
  }

  const { minDeviationPercentage } = config;
  const shouldUpdatePrices = maxDeviation >= minDeviationPercentage;

  return {
    shouldUpdatePrices,
    warningMessage: shouldUpdatePrices
      ? ""
      : "Value has not deviated enough to be updated",
  };
};

const calculateDeviation = (
  valueFromFetchedDataPackage: number,
  valueFromContract: number
) => {
  const pricesDiff = Math.abs(valueFromContract - valueFromFetchedDataPackage);
  const minDividerValue = Math.min(
    valueFromContract,
    valueFromFetchedDataPackage
  );
  return (pricesDiff * 100) / minDividerValue;
};

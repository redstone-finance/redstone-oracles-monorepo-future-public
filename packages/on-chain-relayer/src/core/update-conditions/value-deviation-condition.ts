import { INumericDataPoint } from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";
import { config } from "../../config";
import { ValuesForDataFeeds } from "../../types";
import { formatUnits } from "ethers/lib/utils";

const DEFAULT_DECIMALS = 8;

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
        const dataPointObj = dataPoint.toObj() as INumericDataPoint;
        const valueFromContractAsDecimal = Number(
          formatUnits(
            valueFromContract.toString(),
            dataPointObj.decimals ?? DEFAULT_DECIMALS
          )
        );

        const currentDeviation = calculateDeviation(
          dataPointObj.value,
          valueFromContractAsDecimal
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

  if (valueFromContract === 0) {
    return Number.MAX_SAFE_INTEGER;
  }

  return (pricesDiff * 100) / valueFromContract;
};

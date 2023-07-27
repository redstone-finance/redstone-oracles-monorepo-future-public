import { MathUtils } from "redstone-utils";

const omittedDataFeeds = ["___ALL_FEEDS___", "crvUSDBTCETH"];

interface DataPackage {
  [dataFeedId: string]: Array<{
    timestampMilliseconds: number;
    signature: string;
    isSignatureValid: boolean;
    dataPoints: Array<{
      dataFeedId: string;
      value: number;
    }>;
    dataServiceId: string;
    dataFeedId: string;
    signerAddress: string;
  }>;
}

export const compareDataPackagesFromLocalAndProd = (
  dataPackagesFromLocal: DataPackage,
  dataPackagesFromProd: DataPackage,
  maxPercentageValueDifference: number
) => {
  const dataFeedsFromLocal = Object.keys(dataPackagesFromLocal);
  const dataFeedsFromProd = Object.keys(dataPackagesFromProd);

  const missingDataPackagesInLocal = getMissingDataFeedsInDataPackages(
    dataFeedsFromProd,
    dataFeedsFromLocal
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

  compareValuesInDataPackages(
    dataPackagesFromProd,
    dataPackagesFromLocal,
    maxPercentageValueDifference
  );
};

const getMissingDataFeedsInDataPackages = (
  dataFeedsFromFirstDataPackage: string[],
  dataFeedsFromSecondDataPackage: string[]
) =>
  dataFeedsFromFirstDataPackage.filter(
    (dataFeed) =>
      !dataFeedsFromSecondDataPackage.includes(dataFeed) &&
      !omittedDataFeeds.includes(dataFeed)
  );

const compareValuesInDataPackages = (
  firstDataPackage: DataPackage,
  secondDataPackage: DataPackage,
  maxPercentageValueDifference: number
) => {
  for (const [dataFeedId, dataFeedObject] of Object.entries(firstDataPackage)) {
    console.log(
      `Comparing data feeds values from prod and local for ${dataFeedId}`
    );
    if (omittedDataFeeds.includes(dataFeedId)) {
      console.log(`Data feed ${dataFeedId} is omitted, skipping`);
      continue;
    }
    const valueFromFirstDataPackages = dataFeedObject[0].dataPoints[0].value;
    const dataPointsFromSecond = secondDataPackage[dataFeedId];
    const deviations = dataPointsFromSecond.map(({ dataPoints }) =>
      MathUtils.calculateDeviationPercent({
        newValue: valueFromFirstDataPackages,
        prevValue: dataPoints[0].value,
      })
    );
    const maxDeviation = Math.max(...deviations);
    if (maxDeviation >= maxPercentageValueDifference) {
      throw new Error(
        `Value difference for data feed ${dataFeedId} is bigger than maximum (${maxPercentageValueDifference}%) - ${maxDeviation}%`
      );
    }
  }
};

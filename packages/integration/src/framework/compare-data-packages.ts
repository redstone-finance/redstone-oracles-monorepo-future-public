import { MathUtils } from "redstone-utils";
import {
  ALL_FEEDS_DATA_FEED_ID,
  DeviationsPerDataFeed,
} from "./run-long-price-propagation-core-test";

const removedDataFeedsFromManifest = ["FRXETH", "3Crv", "crvFRAX"];

interface DataPackages {
  [dataFeedId: string]: Array<DataPackage>;
}

interface DataPackage {
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
}

export const compareDataPackagesFromLocalAndProd = (
  dataPackagesFromLocal: DataPackages,
  dataPackagesFromProd: DataPackages
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

  return compareValuesInDataPackages(
    dataPackagesFromProd,
    dataPackagesFromLocal
  );
};

const getMissingDataFeedsInDataPackages = (
  dataFeedsFromFirstDataPackage: string[],
  dataFeedsFromSecondDataPackage: string[]
) =>
  dataFeedsFromFirstDataPackage.filter(
    (dataFeed) =>
      !dataFeedsFromSecondDataPackage.includes(dataFeed) &&
      dataFeed !== ALL_FEEDS_DATA_FEED_ID &&
      !removedDataFeedsFromManifest.includes(dataFeed)
  );

const compareValuesInDataPackages = (
  dataPackagesFromProd: DataPackages,
  dataPackagesFromLocal: DataPackages
) => {
  const deviationsPerDataFeed: {
    [dataFeedId: string]: number | DeviationsPerDataFeed;
  } = {};
  for (const [dataFeedId, dataFeedObject] of Object.entries(
    dataPackagesFromProd
  )) {
    if (removedDataFeedsFromManifest.includes(dataFeedId)) {
      console.log(`Data feed ${dataFeedId} is removed from manifest, skipping`);
      continue;
    }
    if (dataFeedId === ALL_FEEDS_DATA_FEED_ID) {
      const deviationsFromBigPackage = compareValuesFromBigPackageAndLocalCache(
        dataFeedObject,
        dataPackagesFromLocal
      );
      deviationsPerDataFeed[ALL_FEEDS_DATA_FEED_ID] = deviationsFromBigPackage;
      continue;
    }
    const dataPointValueFromLocal =
      dataPackagesFromLocal[dataFeedId][0].dataPoints[0].value;
    const deviations = dataFeedObject.map(({ dataPoints }) =>
      MathUtils.calculateDeviationPercent({
        newValue: dataPointValueFromLocal,
        prevValue: dataPoints[0].value,
      })
    );
    const maxDeviation = Math.max(...deviations);
    deviationsPerDataFeed[dataFeedId] = maxDeviation;
  }
  return deviationsPerDataFeed;
};

const compareValuesFromBigPackageAndLocalCache = (
  allFeedObjectFromProd: DataPackage[],
  dataPackagesFromLocal: DataPackages
) => {
  const deviationsPerDataFeed: DeviationsPerDataFeed = {};
  for (const dataPackage of allFeedObjectFromProd) {
    for (const dataPoint of dataPackage.dataPoints) {
      const dataFeedId = dataPoint.dataFeedId;
      if (removedDataFeedsFromManifest.includes(dataFeedId)) {
        console.log(
          `Data feed ${dataFeedId} is removed from manifest, skipping`
        );
        continue;
      }
      const dataFeedValueFromLocal =
        dataPackagesFromLocal[dataFeedId][0].dataPoints[0].value;
      const deviation = MathUtils.calculateDeviationPercent({
        newValue: dataFeedValueFromLocal,
        prevValue: dataPoint.value,
      });
      const currentDeviationPerDataFeed = deviationsPerDataFeed[dataFeedId];
      if (
        !currentDeviationPerDataFeed ||
        deviation > currentDeviationPerDataFeed
      ) {
        deviationsPerDataFeed[dataFeedId] = deviation;
      }
    }
  }
  return deviationsPerDataFeed;
};

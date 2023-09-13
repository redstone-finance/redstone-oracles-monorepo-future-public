import { MathUtils } from "redstone-utils";
import { DataPackagePlainObj, consts } from "redstone-protocol";
import {
  DataPackagesFromLocalAndProd,
  DeviationsPerDataFeed,
  DeviationsPerSource,
  DeviationsWithBigPackage,
  SourceDeviationsPerDataFeed,
} from "./run-long-price-propagation-core-test";

export interface DataPackages {
  [dataFeedId: string]: Array<DataPackagePlainObj>;
}

interface SourceMetadata {
  [source: string]: {
    value: string;
  };
}

export const compareDataPackagesFromLocalAndProd = (
  { dataPackagesFromLocal, dataPackagesFromProd }: DataPackagesFromLocalAndProd,
  removedDataFeeds?: string[],
  dataFeedsNotWorkingLocally?: string[]
) =>
  compareValuesInDataPackages(
    dataPackagesFromProd,
    dataPackagesFromLocal,
    removedDataFeeds,
    dataFeedsNotWorkingLocally
  );

const compareValuesInDataPackages = (
  dataPackagesFromProd: DataPackages,
  dataPackagesFromLocal: DataPackages,
  removedDataFeeds?: string[],
  dataFeedsNotWorkingLocally?: string[]
) => {
  const deviationsPerDataFeed: DeviationsWithBigPackage = {};
  const sourceDeviationsPerDataFeed: SourceDeviationsPerDataFeed = {};
  for (const [dataFeedId, allFeedObjectsFromProd] of Object.entries(
    dataPackagesFromProd
  )) {
    if (
      removedDataFeeds?.includes(dataFeedId) ||
      dataFeedsNotWorkingLocally?.includes(dataFeedId)
    ) {
      console.log(`Data feed ${dataFeedId} is removed from manifest, skipping`);
      continue;
    }
    const ALL_FEEDS_KEY = consts.ALL_FEEDS_KEY as string;
    if (dataFeedId === ALL_FEEDS_KEY) {
      const deviationsFromBigPackage = compareValuesFromBigPackageAndLocalCache(
        allFeedObjectsFromProd,
        dataPackagesFromLocal,
        removedDataFeeds,
        dataFeedsNotWorkingLocally
      );
      deviationsPerDataFeed[ALL_FEEDS_KEY] = deviationsFromBigPackage;
      continue;
    }
    const maxDeviation = compareValuesFromSmallPackagesAndLocalCache(
      dataPackagesFromLocal,
      dataFeedId,
      allFeedObjectsFromProd
    );
    deviationsPerDataFeed[dataFeedId] = maxDeviation;

    const deviationsPerSource = compareSourcesValuesFromProdAndLocal(
      dataPackagesFromLocal,
      dataFeedId,
      allFeedObjectsFromProd
    );
    sourceDeviationsPerDataFeed[dataFeedId] = deviationsPerSource;
  }
  return { deviationsPerDataFeed, sourceDeviationsPerDataFeed };
};

const compareValuesFromSmallPackagesAndLocalCache = (
  dataPackagesFromLocal: DataPackages,
  dataFeedId: string,
  allFeedObjectsFromProd: DataPackagePlainObj[]
) => {
  const dataPointValueFromLocal =
    dataPackagesFromLocal[dataFeedId][0].dataPoints[0].value;
  const deviations = allFeedObjectsFromProd.reduce(
    (deviations, { dataPoints }) => {
      if (areBothValuesValid(dataPointValueFromLocal, dataPoints[0].value)) {
        deviations.push(
          MathUtils.calculateDeviationPercent({
            newValue: dataPointValueFromLocal,
            prevValue: dataPoints[0].value,
          })
        );
      }
      return deviations;
    },
    [] as number[]
  );
  return Math.max(...deviations);
};

const compareSourcesValuesFromProdAndLocal = (
  dataPackagesFromLocal: DataPackages,
  dataFeedId: string,
  allFeedObjectsFromProd: DataPackagePlainObj[]
) => {
  const deviationsPerSource: DeviationsPerSource = {};
  const dataPointsFromLocal = dataPackagesFromLocal[dataFeedId][0].dataPoints;
  const sourceMetadataFromLocal = dataPointsFromLocal[0]?.metadata
    ?.sourceMetadata as SourceMetadata | undefined;

  for (const { dataPoints } of allFeedObjectsFromProd) {
    const sourceMetadataFromProd = dataPoints[0]?.metadata?.sourceMetadata as
      | SourceMetadata
      | undefined;
    if (sourceMetadataFromProd && sourceMetadataFromLocal) {
      for (const [source, { value }] of Object.entries(
        sourceMetadataFromProd
      )) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const valueFromLocal = sourceMetadataFromLocal[source]?.value ?? 0;
        const valueFromProd = value;
        if (areBothValuesValid(valueFromLocal, valueFromProd)) {
          const deviation = MathUtils.calculateDeviationPercent({
            newValue: valueFromLocal,
            prevValue: valueFromProd,
          });
          deviationsPerSource[source] = Math.max(
            deviation,
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            deviationsPerSource[source] ?? 0
          );
        }
      }
    }
  }
  return deviationsPerSource;
};

const compareValuesFromBigPackageAndLocalCache = (
  allFeedObjectsFromProd: DataPackagePlainObj[],
  dataPackagesFromLocal: DataPackages,
  removedDataFeeds?: string[],
  dataFeedsNotWorkingLocally?: string[]
) => {
  const deviationsPerDataFeed: DeviationsPerDataFeed = {};
  for (const dataPackage of allFeedObjectsFromProd) {
    for (const dataPoint of dataPackage.dataPoints) {
      const dataFeedId = dataPoint.dataFeedId;
      if (
        removedDataFeeds?.includes(dataFeedId) ||
        dataFeedsNotWorkingLocally?.includes(dataFeedId)
      ) {
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

const areBothValuesValid = (
  valueFromLocal: number | string,
  valueFromProd: number | string
) =>
  valueFromLocal &&
  valueFromProd &&
  valueFromLocal !== "error" &&
  valueFromProd !== "error";

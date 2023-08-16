import { MathUtils } from "redstone-utils";
import { DataPackagePlainObj, consts } from "redstone-protocol";
import {
  DeviationsPerDataFeed,
  DeviationsPerSource,
  DeviationsWithBigPackage,
  SourceDeviationsPerDataFeed,
} from "./run-long-price-propagation-core-test";

// TODO: remove after updating primary prod nodes
const removedDataFeedsFromManifest = [
  "FRXETH",
  "3Crv",
  "crvFRAX",
  "LINK",
  "TJ_AVAX_USDC_AUTO",
  "YYAV3SA1",
  "XAVA",
  "DAI",
  "BUSD",
  "USDT.e",
];
const sourcesRemovedFromManifest = [
  "bybit",
  "curve-frxeth",
  "curve-3crv",
  "curve-crvfrax",
];

export interface DataPackages {
  [dataFeedId: string]: Array<DataPackagePlainObj>;
}

interface SourceMetadata {
  [source: string]: {
    value: string;
  };
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
      dataFeed !== consts.ALL_FEEDS_KEY &&
      !removedDataFeedsFromManifest.includes(dataFeed)
  );

const compareValuesInDataPackages = (
  dataPackagesFromProd: DataPackages,
  dataPackagesFromLocal: DataPackages
) => {
  const deviationsPerDataFeed: DeviationsWithBigPackage = {};
  const sourceDeviationsPerDataFeed: SourceDeviationsPerDataFeed = {};
  for (const [dataFeedId, allFeedObjectsFromProd] of Object.entries(
    dataPackagesFromProd
  )) {
    if (removedDataFeedsFromManifest.includes(dataFeedId)) {
      console.log(`Data feed ${dataFeedId} is removed from manifest, skipping`);
      continue;
    }
    const ALL_FEEDS_KEY = consts.ALL_FEEDS_KEY as string;
    if (dataFeedId === ALL_FEEDS_KEY) {
      const deviationsFromBigPackage = compareValuesFromBigPackageAndLocalCache(
        allFeedObjectsFromProd,
        dataPackagesFromLocal
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
  const deviations = allFeedObjectsFromProd.map(({ dataPoints }) =>
    MathUtils.calculateDeviationPercent({
      newValue: Number(dataPointValueFromLocal),
      prevValue: Number(dataPoints[0].value),
    })
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
        if (sourcesRemovedFromManifest.includes(source)) {
          console.log(`Source ${source} is removed from manifest, skipping`);
          continue;
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const valueFromLocal = sourceMetadataFromLocal[source]?.value ?? 0;
        const valueFromProd = value;
        if (valueFromLocal && valueFromProd) {
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
  dataPackagesFromLocal: DataPackages
) => {
  const deviationsPerDataFeed: DeviationsPerDataFeed = {};
  for (const dataPackage of allFeedObjectsFromProd) {
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

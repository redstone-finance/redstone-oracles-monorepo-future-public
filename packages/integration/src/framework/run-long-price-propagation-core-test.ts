import {
  buildCacheLayer,
  buildOracleNode,
  CacheLayerInstance,
  configureCleanup,
  OracleNodeInstance,
  sleep,
  startAndWaitForCacheLayer,
  startAndWaitForOracleNode,
  stopCacheLayer,
  stopOracleNode,
} from "./integration-test-framework";
import {
  compareDataPackagesFromLocalAndProd,
  DataPackages,
} from "./compare-data-packages";
import { fetchLatestTimestampFromLocal } from "./fetch-latest-timestamp-from-local-cache";
import { fetchDataPackagesFromCaches } from "./fetch-data-packages-from-local-and-prod-cache";
import { printAllDeviations } from "./print-all-deviations";
import { checkValuesDeviations } from "./check-values-deviations";
import { checkSourcesDeviations } from "./check-sources-deviations";
import { checkMissingDataFeeds } from "./check-missing-data-feeds";

export interface DeviationsPerDataFeed {
  [dataFeedId: string]: number;
}

export interface DeviationsWithBigPackage {
  [dataFeedId: string]: number | DeviationsPerDataFeed;
}

export interface DeviationsPerSource {
  [source: string]: number;
}

export interface SourceDeviationsPerDataFeed {
  [dataFeedId: string]: DeviationsPerSource;
}

export interface DataPackagesFromLocalAndProd {
  dataPackagesFromLocal: DataPackages;
  dataPackagesFromProd: DataPackages;
}

const cacheLayerInstance: CacheLayerInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const MINUTE_IN_MILLISECONDS = 1000 * 60;
const MAX_PERCENTAGE_VALUE_DIFFERENCE = 3;

const stopAll = () => {
  console.log("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance);
};
configureCleanup(stopAll);

export const runLongPricePropagationCoreTest = async (
  manifestFileName: string,
  nodeWorkingTimeInMinutes: number,
  nodeIntervalInMilliseconds: number,
  coldStartIterationsCount: number,
  removedDataFeeds?: string[],
  dataFeedsNotWorkingLocally?: string[]
) => {
  await buildCacheLayer();
  await buildOracleNode();

  await startAndWaitForCacheLayer(cacheLayerInstance, true, true);
  await startAndWaitForOracleNode(
    oracleNodeInstance,
    [cacheLayerInstance],
    manifestFileName
  );

  const nodeWorkingTimeInMilliseconds =
    MINUTE_IN_MILLISECONDS * nodeWorkingTimeInMinutes;
  await sleep(nodeWorkingTimeInMilliseconds);
  stopOracleNode(oracleNodeInstance);

  const latestTimestamp =
    await fetchLatestTimestampFromLocal(cacheLayerInstance);

  if (!latestTimestamp) {
    throw new Error("Cannot fetch latest timestamp from local cache");
  }

  const iterationsCount =
    nodeWorkingTimeInMilliseconds / nodeIntervalInMilliseconds;
  const timestampsRange = [...Array(iterationsCount).keys()];
  const timestampsCountToAnalyze = timestampsRange.slice(
    0,
    iterationsCount - coldStartIterationsCount
  );
  const fetchDataPackagesPromises = [];
  for (const timestampDiffNumber of timestampsCountToAnalyze) {
    const newTimestamp =
      latestTimestamp - timestampDiffNumber * nodeIntervalInMilliseconds;
    fetchDataPackagesPromises.push(
      fetchDataPackagesFromCaches(
        cacheLayerInstance,
        newTimestamp,
        manifestFileName
      )
    );
  }
  const dataPackagesResponses = await Promise.all(fetchDataPackagesPromises);

  for (const response of dataPackagesResponses) {
    const { responseFromLocalCache, responseFromProdCache, timestamp } =
      response;

    console.log(
      `Comparing data packages from local and prod cache for ${timestamp} timestamp`
    );
    const { deviationsPerDataFeed, sourceDeviationsPerDataFeed } =
      compareDataPackagesFromLocalAndProd(
        {
          dataPackagesFromLocal: responseFromLocalCache,
          dataPackagesFromProd: responseFromProdCache,
        },
        removedDataFeeds,
        dataFeedsNotWorkingLocally
      );
    printAllDeviations(deviationsPerDataFeed);
    checkMissingDataFeeds(
      {
        dataPackagesFromLocal: responseFromLocalCache,
        dataPackagesFromProd: responseFromProdCache,
      },
      removedDataFeeds,
      dataFeedsNotWorkingLocally
    );
    checkValuesDeviations(
      deviationsPerDataFeed,
      MAX_PERCENTAGE_VALUE_DIFFERENCE
    );
    checkSourcesDeviations(
      sourceDeviationsPerDataFeed,
      MAX_PERCENTAGE_VALUE_DIFFERENCE
    );
  }
  process.exit();
};
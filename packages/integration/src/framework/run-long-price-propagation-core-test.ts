import fs from "fs";
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
  updateManifestFile,
} from "./integration-test-framework";
import { compareDataPackagesFromLocalAndProd } from "./compare-data-packages";
import { fetchLatestTimestampFromLocal } from "./fetch-latest-timestamp-from-local-cache";
import { fetchDataPackagesFromCaches } from "./fetch-data-packages-from-local-and-prod-cache";

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
  coldStartIterationsCount: number
) => {
  await buildCacheLayer();
  await buildOracleNode();

  await startAndWaitForCacheLayer(cacheLayerInstance, true, true);
  overwriteNodeInterval(nodeIntervalInMilliseconds, manifestFileName);
  await startAndWaitForOracleNode(
    oracleNodeInstance,
    [cacheLayerInstance],
    `${manifestFileName}-${oracleNodeInstance.instanceId}`
  );

  const nodeWorkingTimeInMilliseconds =
    MINUTE_IN_MILLISECONDS * nodeWorkingTimeInMinutes;
  await sleep(nodeWorkingTimeInMilliseconds);
  stopOracleNode(oracleNodeInstance);

  const latestTimestamp = await fetchLatestTimestampFromLocal(
    cacheLayerInstance
  );

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
    compareDataPackagesFromLocalAndProd(
      responseFromLocalCache,
      responseFromProdCache,
      MAX_PERCENTAGE_VALUE_DIFFERENCE
    );
  }
  process.exit();
};

const overwriteNodeInterval = (
  nodeInterval: number,
  manifestFileName: string
) => {
  const newManifestPath = `../oracle-node/manifests/${manifestFileName}-${oracleNodeInstance.instanceId}.json`;
  fs.copyFileSync(
    `../oracle-node/manifests/${manifestFileName}.json`,
    newManifestPath
  );
  updateManifestFile("interval", String(nodeInterval), newManifestPath);
};

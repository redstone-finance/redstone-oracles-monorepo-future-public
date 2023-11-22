import { consts } from "@redstone-finance/protocol";
import { RedstoneCommon } from "@redstone-finance/utils";
import { checkMissingDataFeeds } from "./check-missing-data-feeds";
import { checkSourcesDeviations } from "./check-sources-deviations";
import { checkValuesDeviations } from "./check-values-deviations";
import {
  compareDataPackagesFromLocalAndProd,
  DataPackages,
} from "./compare-data-packages";
import { fetchDataPackagesFromCaches } from "./fetch-data-packages-from-local-and-prod-cache";
import { fetchLatestTimestampFromLocal } from "./fetch-latest-timestamp-from-local-cache";
import {
  configureCleanup,
  GatewayInstance,
  OracleNodeInstance,
  startAndWaitForGateway,
  startAndWaitForOracleNode,
  stopGateway,
  stopOracleNode,
} from "./integration-test-framework";
import { printAllDeviations } from "./print-all-deviations";

export interface DeviationsPerDataFeed {
  [dataFeedId: string]: number;
}

export type DeviationsWithBigPackage = DeviationsPerDataFeed & {
  [consts.ALL_FEEDS_KEY]?: DeviationsPerDataFeed;
};

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

const gatewayInstance: GatewayInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const MINUTE_IN_MILLISECONDS = 1000 * 60;
const MAX_PERCENTAGE_VALUE_DIFFERENCE = 3;

const stopAll = () => {
  console.log("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopGateway(gatewayInstance);
};
configureCleanup(stopAll);

export const runLongPricePropagationCoreTest = async (
  manifestFileName: string,
  nodeWorkingTimeInMinutes: number,
  nodeIntervalInMilliseconds: number,
  coldStartIterationsCount: number,
  removedDataFeeds: string[],
  dataFeedsNotWorkingLocally: string[],
  sourcesToSkip: string[]
) => {
  await startAndWaitForGateway(gatewayInstance, {
    enableHistoricalDataServing: true,
    directOnly: true,
  });
  await startAndWaitForOracleNode(
    oracleNodeInstance,
    [gatewayInstance],
    manifestFileName
  );

  const nodeWorkingTimeInMilliseconds =
    MINUTE_IN_MILLISECONDS * nodeWorkingTimeInMinutes;
  await RedstoneCommon.sleep(nodeWorkingTimeInMilliseconds);
  stopOracleNode(oracleNodeInstance);

  const latestTimestamp = await fetchLatestTimestampFromLocal(gatewayInstance);

  if (!latestTimestamp) {
    throw new Error("Cannot fetch latest timestamp from local cache");
  }

  const iterationsCount =
    nodeWorkingTimeInMilliseconds / nodeIntervalInMilliseconds;
  const fetchDataPackagesPromises = [];
  for (
    let timestampDiffNumber = 0;
    timestampDiffNumber < iterationsCount - coldStartIterationsCount;
    ++timestampDiffNumber
  ) {
    const newTimestamp =
      latestTimestamp - timestampDiffNumber * nodeIntervalInMilliseconds;
    fetchDataPackagesPromises.push(
      fetchDataPackagesFromCaches(
        gatewayInstance,
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
      MAX_PERCENTAGE_VALUE_DIFFERENCE,
      sourcesToSkip
    );
  }
  process.exit();
};

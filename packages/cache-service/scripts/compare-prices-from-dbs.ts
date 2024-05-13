import { DataPointPlainObj, consts } from "@redstone-finance/protocol";
import mongoose from "mongoose";
import config from "../src/config";
import { CachedDataPackage } from "../src/data-packages/data-packages.model";
import {
  formatTime,
  getDeviationPercentage,
  groupDataPackagesByField,
  queryDataPackages,
} from "./common";

mongoose.set("strictQuery", false);

// USAGE: yarn run-ts scripts/compare-prices-from-dbs.ts

interface TimestampIntervals {
  startTimestamp: number;
  endTimestamp: number;
}

/* 
  Because we want to compare big time periods e.g. 14 days
  we need to split it into one day batches. 
  If you want to compare shorter periods than 1 day define DAYS = 1,
  and BATCH_SIZE_MILLISECONDS to expected time period e.g. 1 hour.
*/
const DAYS = 7;
const BATCH_SIZE_MILLISECONDS = 24 * 60 * 60 * 1000;
const START_TIMESTAMP = Date.now();
const FIRST_DATA_SERVICE_ID = "redstone-avalanche-demo";
const SECOND_DATA_SERVICE_ID = "redstone-avalanche-prod";
const MIN_DEVIATION_PERCENTAGE_TO_LOG = 1;

const TOKENS_ONLY_IN_ONE_DB = [
  "stETH",
  "USDT.e",
  "YAK",
  "gmdUSDC",
  "gmdAVAX",
  "gmdBTC",
  "gmdETH",
  "EUROC",
  "TJ_AVAX_USDC_AUTO",
  "CRV",
  "crvUSDBTCETH",
  "IB01.L",
];

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  console.log(`Comparing prices from ${DAYS} days`);
  const timestampsConfigs = defineTimestampsIntervals();

  for (const timestampIntervals of timestampsConfigs) {
    const { dataPackagesFromFirst, dataPackagesFromSecond } =
      await fetchDataPackagesFromBothMongoDbs(timestampIntervals);
    if (
      dataPackagesFromFirst.length === 0 ||
      dataPackagesFromSecond.length === 0
    ) {
      console.log(
        "Data packages from first or second are empty, finishing process"
      );
      process.exit(0);
    }

    const dataPackagesFromFirstByTimestamp = groupDataPackagesByField(
      dataPackagesFromFirst,
      "timestampMilliseconds"
    );

    const dataPackagesFromSecondByTimestamp = groupDataPackagesByField(
      dataPackagesFromSecond,
      "timestampMilliseconds"
    );

    for (const [timestamp, dataPackagesFromFirst] of Object.entries(
      dataPackagesFromFirstByTimestamp
    )) {
      const dataPackagesFromSecond =
        dataPackagesFromSecondByTimestamp[timestamp];
      const timestampAsNumber = Number(timestamp);

      const arrayOfUniqueDataFeedsIdsFromFirst: Set<string>[] = [];
      const arrayOfUniqueDataFeedsIdsFromSecond: Set<string>[] = [];
      for (const dataPackageFromFirst of dataPackagesFromFirst) {
        const allDataPoints = dataPackageFromFirst.dataPoints;
        addUniqueDataFeedsIdsSetsFromSecond(
          dataPackagesFromSecond,
          arrayOfUniqueDataFeedsIdsFromSecond
        );
        const warnings = compareDataPointsValuesFromFirstAndSecond(
          allDataPoints,
          dataPackagesFromSecond,
          timestampAsNumber
        );

        if (warnings.length > 0) {
          warnings.forEach((warning) => console.log(warning));
        }

        arrayOfUniqueDataFeedsIdsFromFirst.push(
          getSetOfDataFeedsIds(allDataPoints)
        );
      }

      handleComparingSetsOfDataPoints(
        arrayOfUniqueDataFeedsIdsFromFirst,
        arrayOfUniqueDataFeedsIdsFromSecond,
        timestampAsNumber
      );
    }
  }
  console.log(`End time: ${formatTime(Date.now())}`);
})();

function defineTimestampsIntervals(): TimestampIntervals[] {
  return [...Array(DAYS).keys()].map((index) => ({
    startTimestamp: START_TIMESTAMP - BATCH_SIZE_MILLISECONDS * (index + 1),
    endTimestamp: START_TIMESTAMP - BATCH_SIZE_MILLISECONDS * index,
  }));
}

async function fetchDataPackagesFromBothMongoDbs(
  timestampIntervals: TimestampIntervals
) {
  console.log(
    `Fetching data packages from first MongoDb, timestamp intervals: ${JSON.stringify(
      timestampIntervals
    )}`
  );
  const dataPackagesFromFirst = await fetchDataPackages(
    config.mongoDbUrl!,
    timestampIntervals,
    FIRST_DATA_SERVICE_ID
  );

  const secondMongoDbUrl = process.env.SECOND_MONGO_DB_URL;
  if (!secondMongoDbUrl) {
    throw new Error("Missing second MongoDb URL");
  }
  console.log(
    `Fetching data packages from second MongoDb, timestamp intervals: ${JSON.stringify(
      timestampIntervals
    )}`
  );
  const dataPackagesFromSecond = await fetchDataPackages(
    secondMongoDbUrl,
    timestampIntervals,
    SECOND_DATA_SERVICE_ID
  );
  return { dataPackagesFromFirst, dataPackagesFromSecond };
}

async function fetchDataPackages(
  mongoDbUrl: string,
  timestampIntervals: TimestampIntervals,
  dataServiceId: string
) {
  try {
    const mongoConnection = await mongoose.connect(mongoDbUrl);
    console.log("MongoDB connected");
    const dataPackages = await queryDataPackages({
      startTimestamp: timestampIntervals.startTimestamp,
      endTimestamp: timestampIntervals.endTimestamp,
      dataFeedId: consts.ALL_FEEDS_KEY,
      dataServiceId: dataServiceId,
    });
    console.log(`Fetched ${dataPackages.length} data packages`);
    await mongoConnection.disconnect();
    console.log("MongoDB disconnected");
    return dataPackages;
  } catch (error) {
    console.log(error);
    return [];
  }
}

function compareDataPointsValuesFromFirstAndSecond(
  allDataPoints: DataPointPlainObj[],
  dataPackagesFromSecond: CachedDataPackage[],
  timestamp: number
) {
  const warnings: string[] = [];
  for (const dataPoint of allDataPoints) {
    const dataPointsFromSecond = getDataPointsFromSecond(
      dataPackagesFromSecond,
      dataPoint.dataFeedId
    );
    const deviations = dataPointsFromSecond.map(({ value }) =>
      getDeviationPercentage(Number(value), Number(dataPoint.value))
    );
    const maxDeviation = Math.max(...deviations);
    if (maxDeviation > MIN_DEVIATION_PERCENTAGE_TO_LOG) {
      warnings.push(
        `Max deviation for ${
          dataPoint.dataFeedId
        }: ${maxDeviation}, timestamp: ${formatTime(timestamp)}`
      );
    }
  }
  return warnings;
}

function addUniqueDataFeedsIdsSetsFromSecond(
  dataPackagesFromSecond: CachedDataPackage[],
  arrayOfUniqueDataFeedsIdsFromSecond: Set<string>[]
) {
  for (const dataPackageFromSecond of dataPackagesFromSecond) {
    const uniqueDataPointsFromSecond = getSetOfDataFeedsIds(
      dataPackageFromSecond.dataPoints
    );
    arrayOfUniqueDataFeedsIdsFromSecond.push(uniqueDataPointsFromSecond);
  }
}

function getDataPointsFromSecond(
  dataPackagesFromSecond: CachedDataPackage[],
  dataFeedId: string
) {
  const dataPointsFromSecond: DataPointPlainObj[] = [];
  for (const dataPackageFromSecond of dataPackagesFromSecond) {
    dataPointsFromSecond.push(
      ...findDataPointsFromSecondByDataFeedId(dataPackageFromSecond, dataFeedId)
    );
  }
  return dataPointsFromSecond;
}

function findDataPointsFromSecondByDataFeedId(
  dataPackageFromSecond: CachedDataPackage,
  dataFeedId: string
) {
  const dataPointsToAdd: DataPointPlainObj[] = [];
  for (const dataPointFromSecond of dataPackageFromSecond.dataPoints) {
    if (dataPointFromSecond.dataFeedId === dataFeedId) {
      dataPointsToAdd.push(dataPointFromSecond);
    }
  }
  return dataPointsToAdd;
}

function getSetOfDataFeedsIds(dataPoints: DataPointPlainObj[]) {
  return new Set(dataPoints.map(({ dataFeedId }) => dataFeedId));
}

function compareEachSetInTwoArrays(
  leftArrayOfSets: Set<string>[],
  rightArrayOfSets: Set<string>[]
) {
  const diffs: Set<string>[] = [];
  for (const leftSet of leftArrayOfSets) {
    for (const rightSet of rightArrayOfSets) {
      const diff = compareDataPointsSets(leftSet, rightSet);
      if (diff.size >= 1) {
        diffs.push(diff);
      }
    }
  }
  return diffs;
}

function compareDataPointsSets(leftSet: Set<string>, rightSet: Set<string>) {
  const diff = new Set(
    [...leftSet]
      .filter((leftSetElement) => !rightSet.has(leftSetElement))
      .concat(
        [...rightSet].filter((rightSetElement) => !leftSet.has(rightSetElement))
      )
  );
  const diffValues = Array.from(diff);
  const filteredDiffValues = diffValues.filter(
    (diffValue) => !TOKENS_ONLY_IN_ONE_DB.includes(diffValue)
  );
  return new Set(filteredDiffValues);
}

function handleComparingSetsOfDataPoints(
  arrayOfUniqueDataFeedsIdsFromFirst: Set<string>[],
  arrayOfUniqueDataFeedsIdsFromSecond: Set<string>[],
  timestamp: number
) {
  const compareOptions = [
    {
      left: arrayOfUniqueDataFeedsIdsFromFirst,
      right: arrayOfUniqueDataFeedsIdsFromFirst,
      type: "first",
    },
    {
      left: arrayOfUniqueDataFeedsIdsFromSecond,
      right: arrayOfUniqueDataFeedsIdsFromSecond,
      type: "second",
    },
    {
      left: arrayOfUniqueDataFeedsIdsFromFirst,
      right: arrayOfUniqueDataFeedsIdsFromSecond,
      type: "first and second",
    },
  ];

  for (const option of compareOptions) {
    compareSetsOfDataPointsAndLogWarnings(
      option.left,
      option.right,
      timestamp,
      option.type
    );
  }
}

function compareSetsOfDataPointsAndLogWarnings(
  leftArrayOfSets: Set<string>[],
  rightArrayOfSets: Set<string>[],
  timestamp: number,
  type: string
) {
  const diffs = compareEachSetInTwoArrays(leftArrayOfSets, rightArrayOfSets);
  logDataPointsMismatchWarnings(diffs, timestamp, type);
}

function logDataPointsMismatchWarnings(
  diffs: Set<string>[],
  timestampAsNumber: number,
  type: string
) {
  diffs.forEach((diff) =>
    console.log(
      `Data points mismatch, timestamp: ${formatTime(
        timestampAsNumber
      )}, data points from ${type} DB, difference: ${[...diff].join(",")}`
    )
  );
}

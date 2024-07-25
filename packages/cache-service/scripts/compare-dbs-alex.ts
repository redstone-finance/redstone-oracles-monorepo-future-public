import { consts } from "@redstone-finance/protocol";
import "dotenv/config";
import mongoose from "mongoose";
import {
  CachedDataPackage,
  DataPackage,
} from "../src/data-packages/data-packages.model";

const END_TIMESTAMP = getRoundedCurrentTimestamp();
const START_TIMESTAMP = END_TIMESTAMP - 3 * 24 * 3600 * 1000; // END_TIMESTAMP - 5 days

const ANALYZE_ONLY_BIG_PACKAGES: boolean = true;
const ENABLE_TIMESTAMP_LOGGING: boolean = false;
const ENABLE_LOGGING_OF_MISSING_FEEDS: boolean = true;
const ENABLE_MISSING_VALUE_FOR_SIGNERS_CHECK: boolean = false;
const ENABLE_DATA_PACKAGES_COUNT_CHECK: boolean = false;
const MIN_DEVIATION_FOR_WARNING = 1; // 1%
const PAGE_SIZE_MILLISECONDS = 24 * 3600 * 1000;
const EXCEPTIONAL_DEVIATION = 4242;
const DATA_SERVICE_ID_1 = "redstone-avalanche-demo";
const DATA_SERVICE_ID_2 = "redstone-avalanche-prod";
const DB_URL_1 = getRequiredEnv("MONGO_DB_DEV");
const DB_URL_2 = getRequiredEnv("MONGO_DB_PROD");

// Mappings from a signer address to an expected number of data packages
const EXPECTED_SIGNERS_1 = {
  "0x3a7d971De367FE15D164CDD952F64205F2D9f10c": 1,
};
const EXPECTED_SIGNERS_2 = {
  "0x1eA62d73EdF8AC05DfceA1A34b9796E937a29EfF": 2,
  "0x2c59617248994D12816EE1Fa77CE0a64eEB456BF": 2,
  "0x12470f7aBA85c8b81D63137DD5925D6EE114952b": 2,
  "0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB": 2,
  "0x83cbA8c619fb629b81A65C2e67fE15cf3E3C9747": 2,
};

type Timestamp = number;
type DataFeedId = string;
type SignerAddress = string;
type DataPackagesResponse = Record<
  Timestamp,
  DataPackagesForManyFeeds | undefined
>;
type DataPackagesForManyFeeds = Record<
  DataFeedId,
  DataPackagesForManySigners | undefined
>;
type SimplifiedDataPackage = {
  value: number;
};
type DataPackagesForManySigners = Record<
  SignerAddress,
  SimplifiedDataPackage[] | undefined
>;
type ValuesPerSigner = {
  [signer: string]: number[] | undefined;
};
type TimeInterval = {
  startTimestamp: number;
  endTimestamp: number;
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main() {
  const intervals = splitToIntervals(
    {
      startTimestamp: START_TIMESTAMP,
      endTimestamp: END_TIMESTAMP,
    },
    PAGE_SIZE_MILLISECONDS
  );

  for (const interval of intervals) {
    console.log("\n\n=== Analyzing interval ===");
    prettyPrintInterval(interval);

    console.log("Loading data from the 1st DB...");
    const dataPackages1 = await getDataPackages(
      DB_URL_1,
      DATA_SERVICE_ID_1,
      interval
    );

    console.log("Loading data from the 2nd DB...");
    const dataPackages2 = await getDataPackages(
      DB_URL_2,
      DATA_SERVICE_ID_2,
      interval
    );

    console.log("Loading from DBs completed. Comparing data...");
    compareDataInInterval(dataPackages1, dataPackages2);
    console.log("Comparison completed");
  }
}

function compareDataInInterval(
  dataPackages1: DataPackagesResponse,
  dataPackages2: DataPackagesResponse
) {
  const dataFeedIds1 = extractAllDataFeedIds(dataPackages1);
  const dataFeedIds2 = extractAllDataFeedIds(dataPackages2);
  checkMissesInSets("Data feed ids", dataFeedIds1, dataFeedIds2);
  const commonDataFeedIds = getIntersection(dataFeedIds1, dataFeedIds2);

  const timestamps1 = extractAllTimestamps(dataPackages1);
  const timestamps2 = extractAllTimestamps(dataPackages2);
  checkMissesInSets("Timestamps", timestamps1, timestamps2);
  const commonTimestamps = getIntersection(timestamps1, timestamps2);

  for (const timestamp of commonTimestamps) {
    compareDataPackagesAtTimestamp(
      dataPackages1,
      dataPackages2,
      commonDataFeedIds,
      timestamp
    );
  }
}

function compareDataPackagesAtTimestamp(
  dataPackages1: DataPackagesResponse,
  dataPackages2: DataPackagesResponse,
  dataFeedIds: Set<string>,
  timestamp: number
) {
  const formattedTime = formatTimestamp(timestamp);
  const timestampContext = `Timestamp: ${timestamp} (${formattedTime})`;

  if (ENABLE_TIMESTAMP_LOGGING) {
    console.log(timestampContext);
  }

  for (const dataFeedId of dataFeedIds) {
    const context = `Data feed: ${dataFeedId}. ${timestampContext}`;

    const valuesPerSigner1 = extractValuesForDataFeed(
      dataPackages1[timestamp]!,
      dataFeedId
    );
    const valuesPerSigner2 = extractValuesForDataFeed(
      dataPackages2[timestamp]!,
      dataFeedId
    );

    if (isObjectEmpty(valuesPerSigner1) || isObjectEmpty(valuesPerSigner2)) {
      if (ENABLE_LOGGING_OF_MISSING_FEEDS) {
        console.log(`Missing data feed. ${context}.`, {
          valuesPerSigner1,
          valuesPerSigner2,
        });
      }
      continue;
    }

    checkNumberOfPackages(
      valuesPerSigner1,
      EXPECTED_SIGNERS_1,
      context + ". First DB"
    );
    checkNumberOfPackages(
      valuesPerSigner2,
      EXPECTED_SIGNERS_2,
      context + ". Second DB"
    );
    checkDeviation(valuesPerSigner1, valuesPerSigner2, context);
  }
}

function checkDeviation(
  valuesPerSigner1: ValuesPerSigner,
  valuesPerSigner2: ValuesPerSigner,
  context: string
) {
  const values1 = Object.values(valuesPerSigner1).flat() as number[];
  const values2 = Object.values(valuesPerSigner2).flat() as number[];

  const deviation = getMaxDeviation(values1, values2);

  // Print warning if deviation is higher then expected
  if (deviation > MIN_DEVIATION_FOR_WARNING) {
    console.log(`Deviation ${deviation}%. ${context}`, {
      valuesPerSigner1,
      valuesPerSigner2,
    });
  }
}

function checkNumberOfPackages(
  valuesPerSigner: ValuesPerSigner,
  expectedSigners: Record<string, number>,
  context: string
) {
  for (const [signerAddress, expectedPackagesCount] of Object.entries(
    expectedSigners
  )) {
    const valuesForSigner = valuesPerSigner[signerAddress];

    if (!valuesForSigner) {
      if (ENABLE_MISSING_VALUE_FOR_SIGNERS_CHECK) {
        console.log(`Value missing for ${signerAddress}. ${context}`);
      }
    } else if (valuesForSigner.length !== expectedPackagesCount) {
      if (ENABLE_DATA_PACKAGES_COUNT_CHECK) {
        console.log(
          `Unexpected number of data packages: ${valuesForSigner.length}. Expected: ${expectedPackagesCount}. ${context}`
        );
      }
    }
  }
}

function getMaxDeviation(values1: number[], values2: number[]): number {
  if (values1.length === 0 || values2.length === 0) {
    console.log(
      `Deviation can not be calculated correctly. One of the arrays is empty.`
    );
    return EXCEPTIONAL_DEVIATION;
  }

  return Math.max(
    calcDeviation(Math.min(...values1), Math.max(...values2)),
    calcDeviation(Math.max(...values1), Math.min(...values2))
  );
}

function extractValuesForDataFeed(
  dataPackagesForManyFeeds: DataPackagesForManyFeeds,
  dataFeedId: string
): ValuesPerSigner {
  const valuesPerSigner: ValuesPerSigner = {};

  if (!dataPackagesForManyFeeds[dataFeedId]) {
    return {};
  } else {
    for (const [signer, dataPackages] of Object.entries(
      dataPackagesForManyFeeds[dataFeedId]
    )) {
      valuesPerSigner[signer] = dataPackages!.map((dp) => dp.value);
    }

    return valuesPerSigner;
  }
}

async function getDataPackages(
  dbUrl: string,
  dataServiceId: string,
  interval: TimeInterval
): Promise<DataPackagesResponse> {
  console.log(`Connecting to DB`);
  mongoose.set("strictQuery", false);
  const mongoConnection = await mongoose.connect(dbUrl);
  console.log(`Connected to DB`);

  console.log(`Fetching data packages from DB...`);
  const fetchedPackages = await queryDataPackages(dataServiceId, interval);
  console.log(`Fetched ${fetchedPackages.length} data packages`);

  await mongoConnection.disconnect();
  console.log(`Disconnected from DB`);

  return groupDataPackages(fetchedPackages);
}

function groupDataPackages(
  dataPackages: CachedDataPackage[]
): DataPackagesResponse {
  const result: DataPackagesResponse = {};

  for (const dataPackage of dataPackages) {
    const { timestampMilliseconds, signerAddress } = dataPackage;
    if (!result[timestampMilliseconds]) {
      result[timestampMilliseconds] = {};
    }

    for (const dataPoint of dataPackage.dataPoints) {
      const { dataFeedId, value } = dataPoint;
      if (!result[timestampMilliseconds][dataFeedId]) {
        result[timestampMilliseconds][dataFeedId] = {};
      }

      if (!result[timestampMilliseconds][dataFeedId][signerAddress]) {
        result[timestampMilliseconds][dataFeedId][signerAddress] = [];
      }

      result[timestampMilliseconds][dataFeedId][signerAddress].push({
        value: value as number,
      });
    }
  }

  return result;
}

async function queryDataPackages(
  dataServiceId: string,
  interval: TimeInterval
): Promise<CachedDataPackage[]> {
  const dataPackages = await DataPackage.find(
    {
      timestampMilliseconds: {
        $gte: interval.startTimestamp,
        $lte: interval.endTimestamp,
      },
      dataServiceId: dataServiceId,
      ...(ANALYZE_ONLY_BIG_PACKAGES
        ? { dataFeedId: consts.ALL_FEEDS_KEY }
        : {}),
    },
    { timestampMilliseconds: 1, signerAddress: 1, dataPoints: 1 }
  );

  return dataPackages;
}

function splitToIntervals(
  interval: TimeInterval,
  pageSizeMilliseconds: number
): TimeInterval[] {
  const { endTimestamp, startTimestamp } = interval;

  if (endTimestamp <= startTimestamp) {
    throw new Error(`Invalid interval: ${JSON.stringify(interval)}`);
  }

  const intervals: TimeInterval[] = [];

  for (
    let currentTimestamp = startTimestamp;
    currentTimestamp < endTimestamp;
    currentTimestamp += pageSizeMilliseconds
  ) {
    intervals.push({
      startTimestamp: currentTimestamp,
      endTimestamp: Math.min(
        currentTimestamp + pageSizeMilliseconds,
        endTimestamp
      ),
    });
  }

  // We reverse the array to start loading from the newest data packages
  intervals.reverse();

  return intervals;
}

function extractAllDataFeedIds(
  dataPackages: DataPackagesResponse
): Set<string> {
  const allDataFeedIds = new Set<string>([]);

  for (const dataPackagesForManyFeeds of Object.values(dataPackages)) {
    for (const dataFeedId of Object.keys(
      dataPackagesForManyFeeds as DataPackagesForManyFeeds
    )) {
      allDataFeedIds.add(dataFeedId);
    }
  }

  return allDataFeedIds;
}

function extractAllTimestamps(dataPackages: DataPackagesResponse): Set<number> {
  return new Set(Object.keys(dataPackages).map(Number));
}

function checkMissesInSets<T>(
  context: string,
  set1: Set<T>,
  set2: Set<T>
): void {
  const onlyInFirst = [...set1].filter((element) => !set2.has(element));
  const onlyInSecond = [...set2].filter((element) => !set1.has(element));
  console.log(context, {
    firstSize: set1.size,
    secondSize: set2.size,
    missesCountInFirst: onlyInSecond.length,
    missesCountInSeconds: onlyInFirst.length,
    onlyInFirst,
    onlyInSecond,
  });
}

function calcDeviation(value1: number, value2: number): number {
  if (value1 <= 0 || value2 <= 0) {
    throw new Error(
      `Values must be positive. Received: ${value1} and ${value2}`
    );
  }
  return (Math.abs(value1 - value2) / Math.min(value1, value2)) * 100;
}

function getIntersection<T>(set1: Set<T>, set2: Set<T>) {
  const intersection = new Set(
    [...set1].filter((element) => set2.has(element))
  );
  return intersection;
}

function getRequiredEnv(envName: string): string {
  if (!process.env[envName]) {
    throw new Error(`Missing env: ${envName}`);
  } else {
    return process.env[envName] ?? "";
  }
}

function prettyPrintInterval(interval: TimeInterval) {
  const { startTimestamp, endTimestamp } = interval;
  const startTime = formatTimestamp(startTimestamp);
  const endTime = formatTimestamp(endTimestamp);
  console.log(
    `Time interval. ` +
      `Start: ${startTimestamp} (${startTime}) ` +
      `End: ${endTimestamp} (${endTime})`
  );
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function getRoundedCurrentTimestamp() {
  return Math.round(Date.now() / 1000) * 1000 - 60 * 1000;
}

function isObjectEmpty(obj: object) {
  return Object.keys(obj).length === 0;
}

import {
  CachedDataPackage,
  DataPackage,
} from "../src/data-packages/data-packages.model";
import { ALL_FEEDS_KEY } from "../src/data-packages/data-packages.service";
import mongoose from "mongoose";
import config from "../src/config";

// USAGE: yarn run-ts scripts/analyze-data-packages.ts

const START_TIMESTAMP = new Date("2023-01-10T05:23:00Z").getTime();
const END_TIMESTAMP = new Date("2023-01-10T05:25:00Z").getTime();
const DATA_SERVICE_ID = "redstone-avalanche-prod";

interface DataPackagesGroupedBySigner {
  [signer: string]: CachedDataPackage[];
}

main();

async function main() {
  await mongoose.connect(config.mongoDbUrl);
  console.log("MongoDB connected");
  const dataPackagesBySigner = await queryDataPackagesGroupedBySigner();
  for (const [signerAddress, dataPackages] of Object.entries(
    dataPackagesBySigner
  )) {
    console.log(`\n\n\n==== ${signerAddress} ====`);
    const sortedDataPackages = dataPackages.sort(
      (a, b) => b.timestampMilliseconds - a.timestampMilliseconds
    );

    let lastTimestamp = 0;
    for (const dataPackage of sortedDataPackages) {
      const timestamp = dataPackage.timestampMilliseconds;
      const diff = lastTimestamp ? lastTimestamp - timestamp : undefined;
      lastTimestamp = timestamp;

      const timestampFromId = new Date(
        (dataPackage as any)._id.getTimestamp()
      ).getTime();

      const timestampFromIdDiff = timestampFromId - timestamp;

      console.log(`\nTime: ${formatTime(timestamp)}. Diff: ${diff}`);

      console.log(`Data points count: ${dataPackage.dataPoints.length}`);

      if (dataPackage.dataPoints.length < 32) {
        console.log(dataPackage.dataPoints);
      }

      if (timestampFromIdDiff > 10000) {
        console.log(`Timestamp from id diff: ${timestampFromIdDiff}`);
      }
    }
  }
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toISOString();
}

async function queryDataPackagesGroupedBySigner(): Promise<DataPackagesGroupedBySigner> {
  const dataPackages = await DataPackage.find(
    {
      timestampMilliseconds: {
        $gte: START_TIMESTAMP,
        $lte: END_TIMESTAMP,
      },
      dataFeedId: ALL_FEEDS_KEY,
      dataServiceId: DATA_SERVICE_ID,
    },
    { timestampMilliseconds: 1, signerAddress: 1, dataPoints: 1 }
  );

  const groupedBySigner: DataPackagesGroupedBySigner = {};

  for (const dataPackage of dataPackages) {
    if (!groupedBySigner[dataPackage.signerAddress]) {
      groupedBySigner[dataPackage.signerAddress] = [];
    }
    groupedBySigner[dataPackage.signerAddress].push(dataPackage);
  }

  return groupedBySigner;
}

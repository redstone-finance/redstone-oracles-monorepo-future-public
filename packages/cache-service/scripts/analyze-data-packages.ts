import {
  CachedDataPackage,
  DataPackage,
} from "../src/data-packages/data-packages.model";
import { ALL_FEEDS_KEY } from "../src/data-packages/data-packages.service";
import mongoose from "mongoose";
import config from "../src/config";
import { MathUtils } from "redstone-utils";

// USAGE: yarn run-ts scripts/analyze-data-packages.ts

const START_TIMESTAMP = Date.now() - 3 * 60 * 1000;
const END_TIMESTAMP = Date.now();
const DATA_SERVICE_ID = "redstone-avalanche-prod";
const MIN_DEVIATION_PERCENTAGE_TO_LOG = 0.1;

const EXPECTED_DATA_FEEDS = [
  "AVAX",
  "BTC",
  "BUSD",
  "DAI",
  "ETH",
  "GLP",
  "GMX",
  "JOE",
  "LINK",
  "MOO_TJ_AVAX_USDC_LP",
  "PNG",
  "PNG_AVAX_ETH_LP",
  "PNG_AVAX_USDC_LP",
  "PNG_AVAX_USDT_LP",
  "PTP",
  "QI",
  "TJ_AVAX_BTC_LP",
  "TJ_AVAX_ETH_LP",
  "TJ_AVAX_USDC_LP",
  "TJ_AVAX_USDT_LP",
  "TJ_AVAX_sAVAX_LP",
  "USDC",
  "USDT",
  "XAVA",
  "YYAV3SA1",
  "YY_AAVE_AVAX",
  "YY_GLP",
  "YY_PNG_AVAX_ETH_LP",
  "YY_PNG_AVAX_USDC_LP",
  "YY_PTP_sAVAX",
  "YY_TJ_AVAX_ETH_LP",
  "YY_TJ_AVAX_USDC_LP",
  "YY_TJ_AVAX_sAVAX_LP",
  "sAVAX",
];

interface DataPackagesGroupedBySigner {
  [signer: string]: CachedDataPackage[];
}

main();

async function main() {
  mongoose.set("strictQuery", true);
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
    const prevValues: { [id: string]: string | number } = {};
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

      if (dataPackage.dataPoints.length < EXPECTED_DATA_FEEDS.length) {
        const missingDataFeeds = EXPECTED_DATA_FEEDS.filter(
          (dataFeedId) =>
            !dataPackage.dataPoints.some((dp) => dp.dataFeedId === dataFeedId)
        );
        console.log("Missing data feeds: " + missingDataFeeds);
      }

      if (timestampFromIdDiff > 10000) {
        console.log(`Timestamp from id diff: ${timestampFromIdDiff}`);
      }

      for (const dataPoint of dataPackage.dataPoints) {
        if (prevValues[dataPoint.dataFeedId]) {
          const deviation = MathUtils.calculateDeviationPercent({
            newValue: Number(prevValues[dataPoint.dataFeedId]),
            prevValue: Number(dataPoint.value),
          });
          if (deviation > MIN_DEVIATION_PERCENTAGE_TO_LOG) {
            console.log(`Deviation for ${dataPoint.dataFeedId}: ${deviation}`);
          }
        }
        prevValues[dataPoint.dataFeedId] = dataPoint.value;
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

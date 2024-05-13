import { consts } from "@redstone-finance/protocol";
import { MathUtils } from "@redstone-finance/utils";
import mongoose from "mongoose";
import config from "../src/config";
import {
  formatTime,
  groupDataPackagesByField,
  queryDataPackages,
} from "./common";

// USAGE: yarn run-ts scripts/analyze-data-packages.ts

const START_TIMESTAMP = Date.now() - 3 * 60 * 1000;
const END_TIMESTAMP = Date.now();
const DATA_SERVICE_ID = "redstone-avalanche-prod";
const MIN_DEVIATION_PERCENTAGE_TO_LOG = 0.1;

const EXPECTED_DATA_FEEDS = [
  "AVAX",
  "BTC",
  "DAI",
  "ETH",
  "GLP",
  "GMX",
  "JOE",
  "LINK",
  "PNG",
  "PNG_AVAX_ETH_LP",
  "PNG_AVAX_USDC_LP",
  "PNG_AVAX_USDT_LP",
  "PTP",
  "QI",
  "USDC",
  "USDT",
  "XAVA",
  "YYAV3SA1",
  "YY_AAVE_AVAX",
  "YY_GLP",
  "YY_PNG_AVAX_ETH_LP",
  "YY_PNG_AVAX_USDC_LP",
  "sAVAX",
];

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

async function main() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoDbUrl!);
  console.log("MongoDB connected");
  const dataPackages = await queryDataPackages({
    startTimestamp: START_TIMESTAMP,
    endTimestamp: END_TIMESTAMP,
    dataFeedId: consts.ALL_FEEDS_KEY,
    dataServiceId: DATA_SERVICE_ID,
  });
  const dataPackagesBySigner = groupDataPackagesByField(
    dataPackages,
    "signerAddress"
  );
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
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
        console.log("Missing data feeds: " + missingDataFeeds.join(","));
      }

      if (timestampFromIdDiff > 10000) {
        console.log(`Timestamp from id diff: ${timestampFromIdDiff}`);
      }

      for (const dataPoint of dataPackage.dataPoints) {
        if (prevValues[dataPoint.dataFeedId]) {
          const deviation = MathUtils.calculateDeviationPercent({
            baseValue: Number(prevValues[dataPoint.dataFeedId]),
            deviatedValue: Number(dataPoint.value),
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

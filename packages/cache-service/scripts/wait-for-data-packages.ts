import { consts } from "@redstone-finance/protocol";
import mongoose from "mongoose";
import config from "../src/config";
import { DataPackage } from "../src/data-packages/data-packages.model";

// USAGE: yarn run-ts scripts/wait-for-data-packages.ts <expected-count> <data-package-id>

// Note! This script is used only in monorepo integration tests

const INTERVAL_MILLISECONDS = 5000; // 5 seconds
const DATA_PACKAGE_ID = process.argv[3] || consts.ALL_FEEDS_KEY;
const EXPECTED_COUNT = parseInt(process.argv[2]);

void main();

async function main() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoDbUrl!);
  console.log("MongoDB connected");

  await checkDataPackagesCount();
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setInterval(checkDataPackagesCount, INTERVAL_MILLISECONDS);
}

async function checkDataPackagesCount() {
  const dataPackagesCount = await queryDataPackages(DATA_PACKAGE_ID);
  console.log(`Fetched data packages count: ${dataPackagesCount}`);
  if (dataPackagesCount >= EXPECTED_COUNT) {
    console.log(
      `Expected data packages count reached: ${EXPECTED_COUNT}. Stopping...`
    );
    process.exit();
  }
}

async function queryDataPackages(dataPackageId: string) {
  const dataPackages = await DataPackage.find({ dataPackageId });
  return dataPackages.length;
}

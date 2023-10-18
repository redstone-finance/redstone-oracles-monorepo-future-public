import { ChildProcess, spawnSync } from "child_process";
import fs from "fs";
import {
  debug,
  PriceSet,
  runWithLogPrefix,
  runWithLogPrefixInBackground,
  stopChild,
  waitForFile,
  waitForSuccess,
  waitForUrl,
} from "./integration-test-utils";
import axios from "axios";

export type RedstoneCacheLayerInstance = {
  instanceId: string;
  mongo?: {
    url: string;
    process: ChildProcess;
  };
  cacheLayerProcess?: ChildProcess;
  cacheLayerPort?: number;
};

const CACHE_LAYER_DIR = "../../../redstone-cache-layer";
const REDSTONE_CACHE_LAYER_INTEGRATION_UTILS_DIR =
  "../../../redstone-cache-layer-integration-test-utils";

const getLogPrefix = (instance: RedstoneCacheLayerInstance) =>
  `cache-layer-${instance.instanceId}`;

const startRedstoneCacheLayer = async (
  instance: RedstoneCacheLayerInstance,
  url: string
) => {
  const cacheLayerPort = 9000;
  const childProcess = runWithLogPrefixInBackground(
    `yarn`,
    ["start"],
    `${getLogPrefix(instance)}`,
    CACHE_LAYER_DIR,
    {
      MONGO_DB_URL: url,
      LIGHT_MODE: "false",
      MODE: "PROD",
    }
  );
  const cacheLayerUrl = `http://localhost:${cacheLayerPort}`;
  await waitForUrl(cacheLayerUrl);

  instance.cacheLayerProcess = childProcess;
  instance.cacheLayerPort = cacheLayerPort;
};

export const startAndWaitForRedstoneCacheLayer = async (
  instance: RedstoneCacheLayerInstance
): Promise<RedstoneCacheLayerInstance> => {
  debug(`starting ${getLogPrefix(instance)}`);

  const mongoUriFile = `${CACHE_LAYER_DIR}/tmp-mongo-db-uri-${instance.instanceId}.log`;
  // Spinning up a mongo DB instance for cache service
  spawnSync("rm", ["-f", mongoUriFile]);
  const mongoProcess = runWithLogPrefixInBackground(
    "yarn",
    [
      "run-ts",
      "scripts/launch-mongodb-in-memory.ts",
      `tmp-mongo-db-uri-${instance.instanceId}.log`,
    ],
    `mongo-db-${instance.instanceId}`,
    CACHE_LAYER_DIR
  );
  await waitForFile(mongoUriFile);
  const mongoUrl = fs.readFileSync(mongoUriFile, "utf-8");

  instance.mongo = {
    process: mongoProcess,
    url: mongoUrl,
  };
  await startRedstoneCacheLayer(instance, mongoUrl);
  return instance;
};

export const stopRedstoneCacheLayer = (
  instance: RedstoneCacheLayerInstance
) => {
  debug(`stopping ${getLogPrefix(instance)}`);
  stopRedstoneCacheLayerInstance(instance);
  stopMongoDb(instance);
};

const stopMongoDb = (instance: RedstoneCacheLayerInstance) => {
  stopChild(instance.mongo?.process, `mongo-${instance.instanceId}`);
};

export const stopRedstoneCacheLayerInstance = (
  instance: RedstoneCacheLayerInstance
) => {
  debug(`stopping direct-${getLogPrefix(instance)}`);
  stopChild(instance.cacheLayerProcess, `direct-${getLogPrefix(instance)}`);
  instance.cacheLayerProcess = undefined;
};

const waitForDataPackages = async (
  expectedDataPackageCount: number,
  feedId: string,
  instance: RedstoneCacheLayerInstance
) => {
  debug(`waiting for ${expectedDataPackageCount} packages for ${feedId}`);
  await runWithLogPrefix(
    "yarn",
    [
      "run-ts",
      "scripts/wait-for-data-packages.ts",
      `${expectedDataPackageCount}`,
      `${feedId}`,
      `${instance.mongo?.url}`,
    ],
    `Waiting ${feedId}`,
    CACHE_LAYER_DIR
  );
};

export const waitForDataInRedstoneCacheLayerAndDisplayIt = async (
  instance: RedstoneCacheLayerInstance
) => {
  // Waiting for data packages to be available in cache layer
  await waitForDataPackages(1, "ETH", instance);
  await waitForDataPackages(1, "BTC", instance);
  await waitForDataPackages(1, "AAVE", instance);

  // Querying data packages from cache service
  const packages = await axios.get(
    `http://localhost:${instance.cacheLayerPort}/prices\?provider\=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  );

  console.log("Fetched packages:", packages.data);
};

export const verifyPricesInRedstoneCacheLayer = async (
  gatewayInstance: RedstoneCacheLayerInstance,
  expectedPrices: PriceSet
) => {
  debug(`verifying prices, waiting for: ${JSON.stringify(expectedPrices)}`);
  const cacheLayerUrl = `http://localhost:${gatewayInstance.cacheLayerPort}`;

  await waitForSuccess(
    async () =>
      await runWithLogPrefix(
        "yarn",
        ["test", "test/verify-prices.test.ts"],
        "redstone-evm-connector",
        REDSTONE_CACHE_LAYER_INTEGRATION_UTILS_DIR,
        {
          CACHE_SERVICE_URLS: JSON.stringify(cacheLayerUrl),
          PRICES_TO_CHECK: JSON.stringify(expectedPrices),
        },
        false
      ),
    5,
    "prices are not what expected"
  );
};

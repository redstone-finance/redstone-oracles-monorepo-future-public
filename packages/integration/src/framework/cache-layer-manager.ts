import { consts } from "@redstone-finance/protocol";
import { ChildProcess, spawnSync } from "child_process";
import fs from "fs";
import {
  PriceSet,
  debug,
  printDotenv,
  runWithLogPrefix,
  runWithLogPrefixInBackground,
  stopChild,
  updateDotEnvFile,
  waitForFile,
  waitForSuccess,
  waitForUrl,
} from "./integration-test-utils";

export type CacheLayerInstance = {
  instanceId: string;
  mongoDbProcess?: ChildProcess;
  directCacheServiceProcess?: ChildProcess;
  publicCacheServiceProcess?: ChildProcess;
  directCacheServicePort?: number;
  publicCacheServicePort?: number;
  dotenvPath?: string;
};

const CACHE_SERVICE_DIR = "../cache-service";
const EVM_CONNECTOR_DIR = "../evm-connector";

const getLogPrefix = (instance: CacheLayerInstance) =>
  `cache-service-${instance.instanceId}`;

let cacheServicePort = 3000;
const portNumberForInstance = (
  instance: CacheLayerInstance,
  direct: boolean
) => {
  if (direct && instance.directCacheServicePort) {
    return instance.directCacheServicePort;
  }
  if (!direct && instance.publicCacheServicePort) {
    return instance.publicCacheServicePort;
  }
  return ++cacheServicePort;
};

const startAndWaitForCacheService = async (
  instance: CacheLayerInstance,
  direct: boolean
) => {
  const cacheServicePort = portNumberForInstance(instance, direct);
  const childProcess = runWithLogPrefixInBackground(
    "node",
    ["dist/src/main"],
    `${direct ? "direct" : "public"}-${getLogPrefix(instance)}`,
    CACHE_SERVICE_DIR,
    {
      DOTENV_CONFIG_PATH: instance.dotenvPath!,
      APP_PORT: `${cacheServicePort}`,
    }
  );
  const cacheServiceUrl = `http://localhost:${cacheServicePort}`;
  await waitForUrl(cacheServiceUrl);
  if (direct) {
    instance.directCacheServiceProcess = childProcess;
    instance.directCacheServicePort = cacheServicePort;
  } else {
    instance.publicCacheServiceProcess = childProcess;
    instance.publicCacheServicePort = cacheServicePort;
  }
};

export const startAndWaitForCacheLayer = async (
  instance: CacheLayerInstance,
  directOnly: boolean,
  enableHistoricalDataServing: boolean = false
): Promise<CacheLayerInstance> => {
  debug(`starting ${getLogPrefix(instance)}`);
  instance.dotenvPath ??= `${CACHE_SERVICE_DIR}/.env-${instance.instanceId}`;

  const mongoUriFile = `${CACHE_SERVICE_DIR}/tmp-mongo-db-uri-${instance.instanceId}.log`;
  // Spinning up a mongo DB instance for cache service
  spawnSync("rm", ["-f", mongoUriFile]);
  instance.mongoDbProcess = runWithLogPrefixInBackground(
    "yarn",
    ["run-ts", "scripts/launch-mongodb-in-memory.ts", mongoUriFile],
    `mongo-db-${instance.instanceId}`,
    CACHE_SERVICE_DIR
  );
  await waitForFile(mongoUriFile);
  const memoryMongoDbUrl = fs.readFileSync(mongoUriFile, "utf-8");

  fs.copyFileSync(`${CACHE_SERVICE_DIR}/.env.example`, instance.dotenvPath);
  updateDotEnvFile("MONGO_DB_URL", memoryMongoDbUrl, instance.dotenvPath);
  updateDotEnvFile(
    "API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES",
    "hehe",
    instance.dotenvPath
  );
  updateDotEnvFile("ENABLE_DIRECT_POSTING_ROUTES", "true", instance.dotenvPath);
  updateDotEnvFile("ENABLE_STREAMR_LISTENING", "false", instance.dotenvPath);
  updateDotEnvFile("USE_MOCK_ORACLE_STATE", "true", instance.dotenvPath);
  updateDotEnvFile(
    "ENABLE_HISTORICAL_DATA_SERVING",
    String(enableHistoricalDataServing),
    instance.dotenvPath
  );
  updateDotEnvFile("MAX_ALLOWED_TIMESTAMP_DELAY", "20000", instance.dotenvPath);
  updateDotEnvFile(
    "ENABLE_HISTORICAL_DATA_SERVING",
    "true",
    instance.dotenvPath
  );
  printDotenv(getLogPrefix(instance), instance.dotenvPath);
  await startAndWaitForCacheService(instance, true);
  if (!directOnly) {
    await startAndWaitForCacheService(instance, false);
  }
  return instance;
};

export const stopCacheLayer = (instance: CacheLayerInstance) => {
  debug(`stopping ${getLogPrefix(instance)}`);
  stopDirectAndPublicCacheServices(instance);
  stopMongoDb(instance);
};

export const stopMongoDb = (instance: CacheLayerInstance) => {
  stopChild(instance.mongoDbProcess, `mongo-${instance.instanceId}`);
  instance.mongoDbProcess = undefined;
};

export const stopDirectCacheService = (instance: CacheLayerInstance) => {
  debug(`stopping direct-${getLogPrefix(instance)}`);
  stopChild(
    instance.directCacheServiceProcess,
    `direct-${getLogPrefix(instance)}`
  );
  instance.directCacheServiceProcess = undefined;
};

export const stopPublicCacheService = (instance: CacheLayerInstance) => {
  debug(`stopping public-${getLogPrefix(instance)}`);
  stopChild(
    instance.publicCacheServiceProcess,
    `public-${getLogPrefix(instance)}`
  );
  instance.publicCacheServiceProcess = undefined;
};

export const stopDirectAndPublicCacheServices = (
  instance: CacheLayerInstance
) => {
  stopDirectCacheService(instance);
  stopPublicCacheService(instance);
};

export const startDirectCacheService = async (instance: CacheLayerInstance) => {
  debug(`start direct-${getLogPrefix(instance)}`);
  await startAndWaitForCacheService(instance, true);
};

export const startPublicCacheService = async (instance: CacheLayerInstance) => {
  debug(`start public-${getLogPrefix(instance)}`);
  await startAndWaitForCacheService(instance, false);
};

export const startDirectAndPublicCacheServices = async (
  instance: CacheLayerInstance
) => {
  await startDirectCacheService(instance);
  await startPublicCacheService(instance);
};

export const waitForDataPackages = async (
  expectedDataPackageCount: number,
  feedId: string,
  instance: CacheLayerInstance
) => {
  debug(`waiting for ${expectedDataPackageCount} packages for ${feedId}`);
  await runWithLogPrefix(
    "yarn",
    [
      "run-ts",
      "scripts/wait-for-data-packages.ts",
      `${expectedDataPackageCount}`,
      `${feedId}`,
    ],
    `Waiting ${feedId}`,
    CACHE_SERVICE_DIR,
    { DOTENV_CONFIG_PATH: instance.dotenvPath! }
  );
};

export const waitForDataAndDisplayIt = async (
  instance: CacheLayerInstance,
  expectedDataPackageCount: number = 1
) => {
  // Waiting for data packages to be available in cache service
  const ALL_FEEDS_KEY = consts.ALL_FEEDS_KEY as string;
  await waitForDataPackages(expectedDataPackageCount, ALL_FEEDS_KEY, instance);
  await waitForDataPackages(expectedDataPackageCount, "ETH", instance);
  await waitForDataPackages(expectedDataPackageCount, "BTC", instance);
  await waitForDataPackages(expectedDataPackageCount, "AAVE", instance);

  // Querying data packages from cache service
  await runWithLogPrefix(
    "curl",
    [
      `http://localhost:${
        instance.publicCacheServicePort ?? instance.directCacheServicePort
      }/data-packages/latest/mock-data-service`,
    ],
    "fetch packages",
    CACHE_SERVICE_DIR
  );
};

export const verifyPricesInCacheService = async (
  cacheLayerInstances: CacheLayerInstance[],
  expectedPrices: PriceSet
) => {
  debug(`verifying prices, waiting for: ${JSON.stringify(expectedPrices)}`);
  const cacheLayerUrls = cacheLayerInstances.map(
    (cacheLayerInstance) =>
      `http://localhost:${
        cacheLayerInstance.publicCacheServicePort ??
        cacheLayerInstance.directCacheServicePort
      }`
  );

  await waitForSuccess(
    async () =>
      await runWithLogPrefix(
        "yarn",
        ["test", "test/monorepo-integration-tests/verify-prices.test.ts"],
        "evm-connector",
        EVM_CONNECTOR_DIR,
        {
          MONOREPO_INTEGRATION_TEST: "true",
          CACHE_SERVICE_URLS: JSON.stringify(cacheLayerUrls),
          PRICES_TO_CHECK: JSON.stringify(expectedPrices),
        },
        false
      ),
    5,
    "prices are not what expected"
  );
};

export const verifyPricesNotInCacheService = async (
  cacheLayerInstances: CacheLayerInstance[],
  expectedPrices: PriceSet
) => {
  try {
    await verifyPricesInCacheService(cacheLayerInstances, expectedPrices);
    throw new Error("IMPOSSIBLE");
  } catch (e) {
    if ((e as Error).message === "IMPOSSIBLE") {
      throw new Error(
        "IMPOSSIBLE: prices were updated even though there was no active node. Most probably there is a bug in testing code."
      );
    }
  }
};

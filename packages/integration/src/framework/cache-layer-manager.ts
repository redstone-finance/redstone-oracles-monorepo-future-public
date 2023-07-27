import { ChildProcess, spawnSync } from "child_process";
import fs from "fs";
import { installAndBuild } from "./integration-test-compile";
import {
  PriceSet,
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
    "yarn",
    ["start:prod"],
    `${direct ? "direct" : "public"}-cache-service-${instance.instanceId}`,
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
  (instance.dotenvPath = `.env-${instance.instanceId}`),
    process.chdir("../cache-service");
  await installAndBuild();

  const mongoUriFile = `./tmp-mongo-db-uri-${instance.instanceId}.log`;
  // Spinning up a mongo DB instance for cache service
  spawnSync("rm", ["-f", mongoUriFile]);
  instance.mongoDbProcess = runWithLogPrefixInBackground(
    "yarn",
    ["run-ts", "scripts/launch-mongodb-in-memory.ts", mongoUriFile],
    `mongo-db-${instance.instanceId}`
  );
  await waitForFile(mongoUriFile);
  const memoryMongoDbUrl = fs.readFileSync(mongoUriFile, "utf-8");

  fs.copyFileSync(".env.example", instance.dotenvPath);
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
  printDotenv("cache service", instance.dotenvPath);
  await startAndWaitForCacheService(instance, true);
  if (!directOnly) {
    await startAndWaitForCacheService(instance, false);
  }
  return instance;
};

export const stopCacheLayer = (cacheLayer: CacheLayerInstance) => {
  stopChild(
    cacheLayer.directCacheServiceProcess,
    `direct cache service-${cacheLayer.instanceId}`
  );
  cacheLayer.directCacheServiceProcess = undefined;
  stopChild(
    cacheLayer?.publicCacheServiceProcess,
    `public cache service-${cacheLayer.instanceId}`
  );
  cacheLayer.publicCacheServiceProcess = undefined;
  stopChild(cacheLayer.mongoDbProcess, `mongo-${cacheLayer?.instanceId}`);
  cacheLayer.mongoDbProcess = undefined;
};

export const stopDirectCacheService = (instance: CacheLayerInstance) => {
  stopChild(
    instance?.directCacheServiceProcess,
    `direct cache service-${instance?.instanceId}`
  );
  instance.directCacheServiceProcess = undefined;
};

export const stopPublicCacheService = (instance: CacheLayerInstance) => {
  stopChild(
    instance?.publicCacheServiceProcess,
    `direct cache service-${instance?.instanceId}`
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
  await startAndWaitForCacheService(instance, true);
};

export const startPublicCacheService = async (instance: CacheLayerInstance) => {
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
  cacheLayerInstance: CacheLayerInstance
) => {
  await runWithLogPrefix(
    "yarn",
    [
      "run-ts",
      "scripts/wait-for-data-packages.ts",
      `${expectedDataPackageCount}`,
      `${feedId}`,
    ],
    `Waiting ${feedId}`,
    { DOTENV_CONFIG_PATH: cacheLayerInstance.dotenvPath! }
  );
};

export const waitForDataAndDisplayIt = async (
  cacheLayerInstance: CacheLayerInstance
) => {
  // Waiting for data packages to be available in cache service
  process.chdir("../cache-service");
  await waitForDataPackages(1, "___ALL_FEEDS___", cacheLayerInstance);
  await waitForDataPackages(1, "ETH", cacheLayerInstance);
  await waitForDataPackages(1, "BTC", cacheLayerInstance);
  await waitForDataPackages(1, "AAVE", cacheLayerInstance);

  // Querying data packages from cache service
  await runWithLogPrefix(
    "curl",
    [
      `http://localhost:${
        cacheLayerInstance.publicCacheServicePort ??
        cacheLayerInstance.directCacheServicePort
      }/data-packages/latest/mock-data-service"`,
    ],
    "fetch packages"
  );
};

export const verifyPricesInCacheService = async (
  cacheLayerInstances: CacheLayerInstance[],
  expectedPrices: PriceSet
) => {
  process.chdir("../evm-connector");
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

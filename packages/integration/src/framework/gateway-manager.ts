import { consts } from "@redstone-finance/protocol";
import * as redstoneSDK from "@redstone-finance/sdk";
import { ChildProcess, spawnSync } from "child_process";
import fs from "fs";
import {
  PriceSet,
  debug,
  printDotenv,
  runWithLogPrefix,
  runWithLogPrefixInBackground,
  stopChild,
  waitForFile,
  waitForSuccess,
  waitForUrl,
  printExtraEnv,
} from "./integration-test-utils";

export type GatewayInstance = {
  instanceId: string;
  mongo?: {
    url: string;
    process: ChildProcess;
  };
  directCacheService?: {
    process: ChildProcess;
    env: Record<string, string>;
  };
  publicCacheService?: {
    process: ChildProcess;
    env: Record<string, string>;
  };
};

const CACHE_SERVICE_DIR = "../cache-service";
const EVM_CONNECTOR_DIR = "../evm-connector";
const DOTENV_PATH = `${CACHE_SERVICE_DIR}/.env.example`;

const getLogPrefix = (instance: GatewayInstance) =>
  `cache-service-${instance.instanceId}`;

let cacheServicePort = 3000;

export type GatewayConfig = {
  dataPackagesTtl?: number;
  directOnly: boolean;
  enableHistoricalDataServing: boolean;
};

export const startAndWaitForGateway = async (
  instance: GatewayInstance,
  gatewayConfig: Partial<GatewayConfig> = {}
): Promise<GatewayInstance> => {
  debug(`starting ${getLogPrefix(instance)}`);

  const mongoUriFile = `${CACHE_SERVICE_DIR}/tmp-mongo-db-uri-${instance.instanceId}.log`;
  // Spinning up a mongo DB instance for cache service
  spawnSync("rm", ["-f", mongoUriFile]);
  const mongoProcess = runWithLogPrefixInBackground(
    "yarn",
    ["run-ts", "scripts/launch-mongodb-in-memory.ts", mongoUriFile],
    `mongo-db-${instance.instanceId}`,
    CACHE_SERVICE_DIR
  );
  await waitForFile(mongoUriFile);
  const mongoUrl = fs.readFileSync(mongoUriFile, "utf-8");

  instance.mongo = {
    process: mongoProcess,
    url: mongoUrl,
  };

  const commonGatewayEnv = {
    MONGO_DB_URL: mongoUrl,
    MONGO_DB_TTL_SECONDS: "3600",
    API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES: "hehe",
    ENABLE_DIRECT_POSTING_ROUTES: "true",
    ENABLE_STREAMR_LISTENING: "false",
    USE_MOCK_ORACLE_STATE: "true",
    ENABLE_HISTORICAL_DATA_SERVING: String(
      gatewayConfig.enableHistoricalDataServing ?? false
    ),
    MAX_ALLOWED_TIMESTAMP_DELAY: "20000",
    DATA_PACKAGES_TTL: (gatewayConfig.dataPackagesTtl ?? 0).toString(),
  };
  printDotenv(getLogPrefix(instance), DOTENV_PATH);
  printExtraEnv(getLogPrefix(instance), commonGatewayEnv);

  await startDirectCacheService(instance, {
    ...commonGatewayEnv,
    APP_PORT: (cacheServicePort++).toString(),
  });
  if (!gatewayConfig.directOnly) {
    await startPublicCacheService(instance, {
      ...commonGatewayEnv,
      APP_PORT: (cacheServicePort++).toString(),
    });
  }
  return instance;
};

export const stopGateway = (instance: GatewayInstance) => {
  debug(`stopping ${getLogPrefix(instance)}`);
  stopDirectAndPublicCacheServices(instance);
  stopMongoDb(instance);
};

export const stopMongoDb = (instance: GatewayInstance) => {
  stopChild(instance.mongo?.process, `mongo-${instance.instanceId}`);
};

export const stopDirectCacheService = (instance: GatewayInstance) => {
  debug(`stopping direct-${getLogPrefix(instance)}`);
  stopChild(
    instance.directCacheService?.process,
    `direct-${getLogPrefix(instance)}`
  );
};

export const stopPublicCacheService = (instance: GatewayInstance) => {
  debug(`stopping public-${getLogPrefix(instance)}`);
  stopChild(
    instance.publicCacheService?.process,
    `public-${getLogPrefix(instance)}`
  );
};

export const stopDirectAndPublicCacheServices = (instance: GatewayInstance) => {
  stopDirectCacheService(instance);
  stopPublicCacheService(instance);
};

export const startDirectCacheService = async (
  instance: GatewayInstance,
  extraEnv: Record<string, string>
) => {
  debug(`start direct-${getLogPrefix(instance)}`);
  const childProcess = runWithLogPrefixInBackground(
    "node",
    ["dist/src/main"],
    `direct-${getLogPrefix(instance)}`,
    CACHE_SERVICE_DIR,
    extraEnv
  );

  const cacheServiceUrl = `http://localhost:${extraEnv["APP_PORT"]}`;
  await waitForUrl(cacheServiceUrl);
  instance.directCacheService = {
    process: childProcess,
    env: extraEnv,
  };
};

export const startPublicCacheService = async (
  instance: GatewayInstance,
  extraEnv: Record<string, string>
) => {
  debug(`start public-${getLogPrefix(instance)}`);
  const childProcess = runWithLogPrefixInBackground(
    "node",
    ["dist/src/main"],
    `public-${getLogPrefix(instance)}`,
    CACHE_SERVICE_DIR,
    extraEnv
  );

  const cacheServiceUrl = `http://localhost:${extraEnv["APP_PORT"]}`;
  await waitForUrl(cacheServiceUrl);
  instance.publicCacheService = {
    process: childProcess,
    env: extraEnv,
  };
};

export const startDirectAndPublicCacheServices = async (
  instance: GatewayInstance
) => {
  const directEnv = instance.directCacheService?.env;
  const publicEnv = instance.publicCacheService?.env;
  if (!directEnv || !publicEnv) {
    throw new Error(
      `You are trying to FIRST start cache service directly, it is forbidden, you should first start gateway startAndWaitForGateway, in subsequent calls starts you can use this method`
    );
  }
  await startDirectCacheService(instance, directEnv);
  await startPublicCacheService(instance, publicEnv);
};

export const waitForDataPackages = async (
  expectedDataPackageCount: number,
  feedId: string,
  instance: GatewayInstance
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
    {
      MONGO_DB_URL: instance.mongo!.url,
      DOTENV_CONFIG_PATH: DOTENV_PATH,
    }
  );
};

export const waitForDataAndDisplayIt = async (
  instance: GatewayInstance,
  expectedDataPackageCount: number = 1
) => {
  // Waiting for data packages to be available in cache service
  await waitForDataPackages(
    expectedDataPackageCount,
    consts.ALL_FEEDS_KEY,
    instance
  );
  await waitForDataPackages(expectedDataPackageCount, "ETH", instance);
  await waitForDataPackages(expectedDataPackageCount, "BTC", instance);
  await waitForDataPackages(expectedDataPackageCount, "AAVE", instance);

  // Querying data packages from cache service
  await runWithLogPrefix(
    "curl",
    [
      `http://localhost:${getCacheServicePort(
        instance,
        "any"
      )}/data-packages/latest/mock-data-service`,
    ],
    "fetch packages",
    CACHE_SERVICE_DIR
  );
};

export const verifyPricesInCacheService = async (
  gatewayInstances: GatewayInstance[],
  expectedPrices: PriceSet
) => {
  debug(`verifying prices, waiting for: ${JSON.stringify(expectedPrices)}`);

  const gatewayUrls = gatewayInstances.map(
    (gatewayInstance) =>
      `http://localhost:${getCacheServicePort(gatewayInstance, "any")}`
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
          CACHE_SERVICE_URLS: JSON.stringify(gatewayUrls),
          PRICES_TO_CHECK: JSON.stringify(expectedPrices),
        },
        false
      ),
    5,
    "prices are not what expected"
  );
};

export const verifyPricesNotInCacheService = async (
  gatewayInstances: GatewayInstance[],
  expectedPrices: PriceSet
) => {
  try {
    await verifyPricesInCacheService(gatewayInstances, expectedPrices);
    throw new Error("IMPOSSIBLE");
  } catch (e) {
    if ((e as Error).message === "IMPOSSIBLE") {
      throw new Error(
        "IMPOSSIBLE: prices were updated even though there was no active node. Most probably there is a bug in testing code."
      );
    }
  }
};

export const fetchDataPackages = async (
  gatewayInstances: GatewayInstance[],
  fetchParams: redstoneSDK.DataPackagesRequestParams = {
    dataServiceId: "mock-data-service",
    uniqueSignersCount: 1,
  }
) => {
  const gatewayUrls = gatewayInstances.map(
    (gatewayInstance) =>
      `http://localhost:${getCacheServicePort(gatewayInstance, "any")}`
  );
  return await redstoneSDK.requestDataPackages({
    ...fetchParams,
    urls: gatewayUrls,
  });
};

export const getCacheServicePort = (
  gatewayInstance: GatewayInstance,
  type: "direct" | "public" | "any"
): string => {
  const publicPort = gatewayInstance.publicCacheService?.env["APP_PORT"];
  const directPort = gatewayInstance.directCacheService?.env["APP_PORT"];

  if (type === "direct") {
    if (!directPort) {
      throw new Error(
        `Missing port for direct cache service. Probably it is not started yet`
      );
    }
    return directPort;
  } else if (type === "public") {
    if (!publicPort) {
      throw new Error(
        `Missing port for public cache service. Probably it is not started yet`
      );
    }
    return publicPort;
  } else {
    if (!publicPort && !directPort) {
      throw new Error(
        `Missing port for public and private cache service. Probably it is not started yet`
      );
    }
    return publicPort ?? directPort!;
  }
};

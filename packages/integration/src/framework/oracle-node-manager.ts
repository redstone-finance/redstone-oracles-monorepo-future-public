import { ChildProcess } from "child_process";
import fs from "fs";
import {
  debug,
  PriceSet,
  printDotenv,
  printExtraEnv,
  runWithLogPrefixInBackground,
  stopChild,
} from "./integration-test-utils";
import { GatewayInstance, getCacheServicePort } from "./gateway-manager";
import { RedstoneCommon } from "@redstone-finance/utils";
import { RedstoneCacheLayerInstance } from "./redstone-cache-layer-manager";

export const HARDHAT_MOCK_PRIVATE_KEYS = [
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
];
const ORACLE_NODE_DIR = "../oracle-node";
const NODE_BROADCAST_TIMEOUT = 300_000;
const EXPECTED_BROADCAST_LOG = "Broadcasting data package completed";

export type OracleNodeInstance = {
  instanceId: string;
  oracleNodeProcess?: ChildProcess;
};

const getLogPrefix = (instance: OracleNodeInstance) =>
  `oracle-node-${instance.instanceId}`;

const mockPricesPath = `${ORACLE_NODE_DIR}/mock-prices.json`;

export const startAndWaitForOracleNodeForRedstoneCacheLayer = (
  instance: OracleNodeInstance,
  redstoneCacheLayerInstances: RedstoneCacheLayerInstance[],
  manifestFileName: string = "single-source/mock",
  privateKeyIndex: number = 0
) => {
  const extraEnv = createExtraEnvForRedstoneCacheLayer(
    instance,
    redstoneCacheLayerInstances,
    manifestFileName,
    privateKeyIndex
  );
  return startAndWaitForOracleNodeWithEnv(instance, extraEnv);
};

export const startAndWaitForOracleNode = (
  instance: OracleNodeInstance,
  cacheServiceInstances: GatewayInstance[],
  manifestFileName: string = "single-source/mock",
  privateKeyIndex: number = 0
) => {
  const extraEnv = createExtraEnv(
    instance,
    cacheServiceInstances,
    manifestFileName,
    privateKeyIndex
  );
  return startAndWaitForOracleNodeWithEnv(instance, extraEnv);
};

const startAndWaitForOracleNodeWithEnv = (
  instance: OracleNodeInstance,
  extraEnv: Record<string, string>
) => {
  debug(`starting ${getLogPrefix(instance)}`);
  const dotenvPath = `${ORACLE_NODE_DIR}/.env.example`;
  printDotenv(getLogPrefix(instance), dotenvPath);
  printExtraEnv(getLogPrefix(instance), extraEnv);
  instance.oracleNodeProcess = runWithLogPrefixInBackground(
    "node",
    ["dist/index"],
    getLogPrefix(instance),
    ORACLE_NODE_DIR,
    {
      ...extraEnv,
      DOTENV_CONFIG_PATH: dotenvPath,
    }
  );

  const isReadyPromise = new Promise<void>((resolve, _rejects) => {
    instance.oracleNodeProcess?.stdout?.on("data", (data: string) => {
      if (data.includes(EXPECTED_BROADCAST_LOG)) {
        resolve();
      }
    });
  });

  return RedstoneCommon.timeout(
    isReadyPromise,
    NODE_BROADCAST_TIMEOUT,
    `Timeout when waiting for node ${getLogPrefix(
      instance
    )} to publish data packages. Was expecting ${EXPECTED_BROADCAST_LOG} log message.`
  );
};

const getMockPricesPath = (instance: OracleNodeInstance) =>
  `${mockPricesPath}-${instance.instanceId}`;

const createExtraEnvForRedstoneCacheLayer = (
  instance: OracleNodeInstance,
  redstoneCacheLayerInstances: RedstoneCacheLayerInstance[],
  manifestFileName: string,
  privateKeyIndex: number
) => {
  const cacheServiceUrls = redstoneCacheLayerInstances.map(
    (redstoneCacheLayerInstance) =>
      `http://localhost:${redstoneCacheLayerInstance.cacheLayerPort}`
  );
  const extraEnv: Record<string, string> = {
    OVERRIDE_PRICE_CACHE_SERVICE_URLS: JSON.stringify(cacheServiceUrls),
    OVERRIDE_MANIFEST_USING_FILE: `./manifests/${manifestFileName}.json`,
    LEVEL_DB_LOCATION: `oracle-node-level-db-${instance.instanceId}`,
    ECDSA_PRIVATE_KEY: HARDHAT_MOCK_PRIVATE_KEYS[privateKeyIndex],
    MOCK_PRICES_URL_OR_PATH: getMockPricesPath(instance),
  };

  return extraEnv;
};

const createExtraEnv = (
  instance: OracleNodeInstance,
  gatewayInstances: GatewayInstance[],
  manifestFileName: string,
  privateKeyIndex: number
) => {
  const cacheServiceUrls = gatewayInstances.map(
    (gatewayInstance) =>
      `http://localhost:${getCacheServicePort(gatewayInstance, "direct")}`
  );
  const extraEnv: Record<string, string> = {
    OVERRIDE_DIRECT_CACHE_SERVICE_URLS: JSON.stringify(cacheServiceUrls),
    OVERRIDE_MANIFEST_USING_FILE: `./manifests/${manifestFileName}.json`,
    LEVEL_DB_LOCATION: `oracle-node-level-db-${instance.instanceId}`,
    ECDSA_PRIVATE_KEY: HARDHAT_MOCK_PRIVATE_KEYS[privateKeyIndex],
    MOCK_PRICES_URL_OR_PATH: getMockPricesPath(instance),
  };

  return extraEnv;
};

export const stopOracleNode = (instance: OracleNodeInstance) => {
  debug(`stopping ${getLogPrefix(instance)}`);
  stopChild(instance.oracleNodeProcess, getLogPrefix(instance));
};

export const setMockPrices = (
  mockPrices: PriceSet,
  instance: OracleNodeInstance
) => {
  debug(
    `setting mock prices to ${JSON.stringify(
      mockPrices
    )} for oracle node ${getLogPrefix(instance)}`
  );
  fs.writeFileSync(getMockPricesPath(instance), JSON.stringify(mockPrices));
};

export const setMockPricesMany = (
  mockPrices: PriceSet,
  instances: OracleNodeInstance[]
) => instances.map((instance) => setMockPrices(mockPrices, instance));

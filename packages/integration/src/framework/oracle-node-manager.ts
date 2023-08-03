import { ChildProcess } from "child_process";
import fs from "fs";
import {
  debug,
  PriceSet,
  printDotenv,
  runWithLogPrefixInBackground,
  stopChild,
  updateDotEnvFile,
} from "./integration-test-utils";
import { installAndBuild } from "./integration-test-compile";
import { CacheLayerInstance } from "./cache-layer-manager";

export const HARDHAT_MOCK_PRIVATE_KEY =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ORACLE_NODE_DIR = "../oracle-node";

export type OracleNodeInstance = {
  instanceId: string;
  oracleNodeProcess?: ChildProcess;
};

export const buildOracleNode = async () =>
  await installAndBuild(ORACLE_NODE_DIR, false);

const getLogPrefix = (instance: OracleNodeInstance) =>
  `oracle-node-${instance.instanceId}`;

const mockPricesPath = `${ORACLE_NODE_DIR}/./mock-prices.json`;
export const startAndWaitForOracleNode = async (
  instance: OracleNodeInstance,
  cacheServiceInstances: CacheLayerInstance[],
  manifestFileName: string = "single-source/mock"
): Promise<void> => {
  debug(`starting ${getLogPrefix(instance)}`);
  const dotenvPath = `${ORACLE_NODE_DIR}/.env-${instance.instanceId}`;
  populateEnvVariables(
    dotenvPath,
    instance,
    cacheServiceInstances,
    manifestFileName
  );
  instance.oracleNodeProcess = runWithLogPrefixInBackground(
    "node",
    ["dist/index"],
    getLogPrefix(instance),
    ORACLE_NODE_DIR,
    { DOTENV_CONFIG_PATH: dotenvPath }
  );
};

const populateEnvVariables = (
  dotenvPath: string,
  instance: OracleNodeInstance,
  cacheServiceInstances: CacheLayerInstance[],
  manifestFileName: string
) => {
  const cacheServiceUrls = cacheServiceInstances.map(
    (cacheLayerInstance) =>
      `http://localhost:${cacheLayerInstance.directCacheServicePort}`
  );
  fs.copyFileSync(`${ORACLE_NODE_DIR}/.env.example`, dotenvPath);
  updateDotEnvFile(
    "OVERRIDE_DIRECT_CACHE_SERVICE_URLS",
    JSON.stringify(cacheServiceUrls),
    dotenvPath
  );
  updateDotEnvFile(
    "OVERRIDE_MANIFEST_USING_FILE",
    `./manifests/${manifestFileName}.json`,
    dotenvPath
  );
  updateDotEnvFile(
    "LEVEL_DB_LOCATION",
    `oracle-node-level-db-${instance.instanceId}`,
    dotenvPath
  );
  updateDotEnvFile("ECDSA_PRIVATE_KEY", HARDHAT_MOCK_PRIVATE_KEY, dotenvPath);
  updateDotEnvFile("MOCK_PRICES_URL_OR_PATH", mockPricesPath, dotenvPath);
  printDotenv(getLogPrefix(instance), dotenvPath);
};

export const stopOracleNode = (instance: OracleNodeInstance) => {
  debug(`stopping ${getLogPrefix(instance)}`);
  stopChild(instance.oracleNodeProcess, getLogPrefix(instance));
};

export const setMockPrices = (mockPrices: PriceSet) => {
  debug(`setting mock prices to ${JSON.stringify(mockPrices)}`);
  fs.writeFileSync(mockPricesPath, JSON.stringify(mockPrices));
};

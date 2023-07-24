import { ChildProcess, spawnSync } from "child_process";
import fs from "fs";
import {
  copyAndReplace,
  printDotenv,
  runWithLogPrefix,
  runWithLogPrefixInBackground,
  stopChild,
  updateDotEnvFile,
  waitForFile,
  waitForUrl,
} from "./integration-test-utils";
import {
  installAndBuild,
  lazilyBuildTypescript,
  lazilyInstallNPMDeps,
} from "./integration-test-compile";

const hardhatMockPrivateKey =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export type CacheLayerInstance = {
  mongoDbProcess?: ChildProcess;
  cacheServiceProcess?: ChildProcess;
  cacheServicePort: number;
  instanceId: string;
  dotenvPath: string;
};

export type OracleNodeInstance = {
  oracleNodeProcess?: ChildProcess;
  instanceId: string;
};

export type RelayerInstance = {
  relayerProcess?: ChildProcess;
  instanceId: string;
};

export type HardhatInstance = {
  hardhatProcess?: ChildProcess;
  instanceId: string;
};

let cacheServicePort = 3000;
export const startAndWaitForCacheLayer = async (
  instanceId: string
): Promise<CacheLayerInstance> => {
  process.chdir("../cache-service");
  await installAndBuild();

  const mongoUriFile = `./tmp-mongo-db-uri-${instanceId}.log`;
  // Spinning up a mongo DB instance for cache service
  spawnSync("rm", ["-f", mongoUriFile]);
  const mongoDbProcess = runWithLogPrefixInBackground(
    "yarn",
    ["run-ts", "scripts/launch-mongodb-in-memory.ts", mongoUriFile],
    `mongo-db-${instanceId}`
  );
  await waitForFile(mongoUriFile);
  const memoryMongoDbUrl = fs.readFileSync(mongoUriFile, "utf-8");

  const dotenvPath = `.env-${instanceId}`;

  fs.copyFileSync(".env.example", dotenvPath);
  updateDotEnvFile("MONGO_DB_URL", memoryMongoDbUrl, dotenvPath);
  updateDotEnvFile("API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES", "hehe", dotenvPath);
  updateDotEnvFile("ENABLE_DIRECT_POSTING_ROUTES", "true", dotenvPath);
  updateDotEnvFile("ENABLE_STREAMR_LISTENING", "false", dotenvPath);
  updateDotEnvFile("USE_MOCK_ORACLE_STATE", "true", dotenvPath);
  printDotenv("cache service", dotenvPath);
  cacheServicePort++;
  const cacheServiceProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start:prod"],
    `cache-service-${instanceId}`,
    { DOTENV_CONFIG_PATH: dotenvPath, APP_PORT: `${cacheServicePort}` }
  );
  const cacheServiceUrl = `http://localhost:${cacheServicePort}`;
  await waitForUrl(cacheServiceUrl);
  return {
    mongoDbProcess,
    cacheServiceProcess,
    instanceId,
    cacheServicePort,
    dotenvPath,
  };
};

export const startAndWaitForOracleNode = async (
  instanceId: string,
  cacheServicePort: number
): Promise<OracleNodeInstance> => {
  // Launching one iteration of oracle-node
  process.chdir("../oracle-node");
  await installAndBuild();

  const dotenvPath = `.env-${instanceId}`;
  fs.copyFileSync(".env.example", dotenvPath);
  updateDotEnvFile(
    "OVERRIDE_DIRECT_CACHE_SERVICE_URLS",
    `["http://localhost:${cacheServicePort}"]`,
    dotenvPath
  );
  updateDotEnvFile(
    "OVERRIDE_MANIFEST_USING_FILE",
    "./manifests/single-source/mock.json",
    dotenvPath
  );
  updateDotEnvFile("ECDSA_PRIVATE_KEY", hardhatMockPrivateKey, dotenvPath);
  printDotenv("oracle node", dotenvPath);
  const oracleNodeProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start"],
    `oracle-node-${instanceId}`,
    { DOTENV_CONFIG_PATH: dotenvPath }
  );
  return { oracleNodeProcess, instanceId };
};

const compileRelayerContracts = async () => {
  await runWithLogPrefix("yarn", ["compile"], "compile relayer contracts");
};

export const startRelayer = async (
  instanceId: string,
  adapterContractAddress: string,
  cacheLayerInstance: CacheLayerInstance
): Promise<RelayerInstance> => {
  process.chdir("../on-chain-relayer");
  await lazilyInstallNPMDeps();
  await compileRelayerContracts();
  await lazilyBuildTypescript();

  const dotenvPath = `.env-${instanceId}`;
  fs.copyFileSync(".env.example", dotenvPath);
  updateDotEnvFile("RPC_URL", "http://127.0.0.1:8545", dotenvPath);
  updateDotEnvFile("PRIVATE_KEY", hardhatMockPrivateKey, dotenvPath);
  updateDotEnvFile(
    "CACHE_SERVICE_URLS",
    `["http://localhost:${cacheLayerInstance.cacheServicePort}"]`,
    dotenvPath
  );
  updateDotEnvFile("HEALTHCHECK_PING_URL", "", dotenvPath);
  updateDotEnvFile(
    "MANIFEST_FILE",
    "../integration/relayerManifest.json",
    dotenvPath
  );
  copyAndReplace(
    /__ADAPTER_CONTRACT_ADDRESS__/,
    adapterContractAddress,
    "../integration/relayerManifestSample.json",
    "../integration/relayerManifest.json"
  );
  printDotenv("on chain relayer", dotenvPath);

  const relayerProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start"],
    `on-chain-relayer-${instanceId}`,
    { DOTENV_CONFIG_PATH: dotenvPath }
  );
  return { relayerProcess, instanceId };
};

export const startAndWaitForHardHat = async (
  instanceId: string
): Promise<HardhatInstance> => {
  process.chdir("../on-chain-relayer");
  await lazilyInstallNPMDeps();
  await compileRelayerContracts();
  const hardhatProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start-node"],
    `hardhat-${instanceId}`
  );
  await waitForUrl("127.0.0.1:8545"); // wait for hardhat to start blockchain instance
  return { hardhatProcess, instanceId };
};

export const stopCacheLayer = (cacheLayer: CacheLayerInstance | undefined) => {
  stopChild(
    cacheLayer?.cacheServiceProcess,
    `cache service-${cacheLayer?.instanceId}`
  );
  stopChild(cacheLayer?.mongoDbProcess, `mongo-${cacheLayer?.instanceId}`);
};

export const stopOracleNode = (oracleNode: OracleNodeInstance | undefined) => {
  stopChild(
    oracleNode?.oracleNodeProcess,
    `oracle node-${oracleNode?.instanceId}`
  );
};

export const stopRelayer = (relayer: RelayerInstance | undefined) => {
  stopChild(relayer?.relayerProcess, `on chain relayer-${relayer?.instanceId}`);
};

export const stopHardhat = (hardhat: HardhatInstance | undefined) => {
  stopChild(hardhat?.hardhatProcess, `hardhat node-${hardhat?.instanceId}`);
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
    { DOTENV_CONFIG_PATH: cacheLayerInstance.dotenvPath }
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
      `http://localhost:${cacheLayerInstance.cacheServicePort}/data-packages/latest/mock-data-service"`,
    ],
    "fetch packages"
  );
};

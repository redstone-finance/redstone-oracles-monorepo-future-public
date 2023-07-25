import { ChildProcess } from "child_process";
import fs from "fs";
import {
  PriceSet,
  printDotenv,
  runWithLogPrefixInBackground,
  stopChild,
  updateDotEnvFile,
} from "./integration-test-utils";
import { installAndBuild } from "./integration-test-compile";
import { CacheLayerInstance } from "./cache-layer-manager";

const hardhatMockPrivateKey =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export type OracleNodeInstance = {
  oracleNodeProcess?: ChildProcess;
  instanceId: string;
};

const mockPricesPath = "./mock-prices.json";
export const startAndWaitForOracleNode = async (
  instance: OracleNodeInstance,
  cacheServiceInstances: CacheLayerInstance[]
): Promise<void> => {
  process.chdir("../oracle-node");
  await installAndBuild();

  const dotenvPath = `.env-${instance.instanceId}`;
  const cacheServiceUrls = cacheServiceInstances.map(
    (cacheLayerInstance) =>
      `http://localhost:${cacheLayerInstance.directCacheServicePort}`
  );
  fs.copyFileSync(".env.example", dotenvPath);
  updateDotEnvFile(
    "OVERRIDE_DIRECT_CACHE_SERVICE_URLS",
    JSON.stringify(cacheServiceUrls),
    dotenvPath
  );
  updateDotEnvFile(
    "OVERRIDE_MANIFEST_USING_FILE",
    "./manifests/single-source/mock.json",
    dotenvPath
  );
  updateDotEnvFile("ECDSA_PRIVATE_KEY", hardhatMockPrivateKey, dotenvPath);
  updateDotEnvFile("MOCK_PRICES_URL_OR_PATH", mockPricesPath, dotenvPath);
  printDotenv("oracle node", dotenvPath);
  instance.oracleNodeProcess = runWithLogPrefixInBackground(
    "yarn",
    ["start"],
    `oracle-node-${instance.instanceId}`,
    { DOTENV_CONFIG_PATH: dotenvPath }
  );
};

export const stopOracleNode = (oracleNode: OracleNodeInstance) => {
  stopChild(
    oracleNode.oracleNodeProcess,
    `oracle node-${oracleNode.instanceId}`
  );
};

export const setMockPrices = (mockPrices: PriceSet) => {
  process.chdir("../oracle-node");
  fs.writeFileSync(mockPricesPath, JSON.stringify(mockPrices));
};

import { ChildProcess } from "child_process";
import fs from "fs";
import {
  copyAndReplace,
  PriceSet,
  printDotenv,
  runWithLogPrefix,
  runWithLogPrefixInBackground,
  stopChild,
  updateDotEnvFile,
  waitForSuccess,
} from "./integration-test-utils";
import { installAndBuild } from "./integration-test-compile";
import { CacheLayerInstance } from "./cache-layer-manager";

const HARDHAT_MOCK_PRIVATE_KEY =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RELAYER_DIR = "../on-chain-relayer";

export type RelayerInstance = {
  relayerProcess?: ChildProcess;
  instanceId: string;
};

const getLogPrefix = (instance: RelayerInstance) =>
  `relayer-${instance.instanceId}`;

export const buildRelayer = async () => installAndBuild(RELAYER_DIR, true);

export const startRelayer = async (
  instance: RelayerInstance,
  adapterContractAddress: string,
  cacheLayerInstance: CacheLayerInstance
): Promise<void> => {
  const dotenvPath = `${RELAYER_DIR}/.env-${instance.instanceId}`;
  fs.copyFileSync(`${RELAYER_DIR}/.env.example`, dotenvPath);
  updateDotEnvFile("RPC_URL", "http://127.0.0.1:8545", dotenvPath);
  updateDotEnvFile("PRIVATE_KEY", HARDHAT_MOCK_PRIVATE_KEY, dotenvPath);
  updateDotEnvFile(
    "CACHE_SERVICE_URLS",
    `["http://localhost:${
      cacheLayerInstance.publicCacheServicePort ??
      cacheLayerInstance.directCacheServicePort
    }"]`,
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

  instance.relayerProcess = runWithLogPrefixInBackground(
    "node",
    ["dist/src/run-relayer"],
    getLogPrefix(instance),
    RELAYER_DIR,
    { DOTENV_CONFIG_PATH: dotenvPath }
  );
};

export const stopRelayer = (instance: RelayerInstance) =>
  stopChild(instance.relayerProcess, getLogPrefix(instance));

export const verifyPricesOnChain = async (
  adapterContractAddress: string,
  expectedPrices: PriceSet
) => {
  const waitForPricesCheck =
    (adapterContractAddress: string) => async (): Promise<boolean> =>
      await runWithLogPrefix(
        "yarn",
        [
          "hardhat",
          "--network",
          "localhost",
          "run",
          "test/monorepo-integration-tests/scripts/verify-mock-prices.ts",
        ],
        "relayer-contract",
        RELAYER_DIR,
        {
          ADAPTER_CONTRACT_ADDRESS: adapterContractAddress,
          PRICES_TO_CHECK: `${JSON.stringify(expectedPrices)}`,
        },
        false
      );
  await waitForSuccess(
    waitForPricesCheck(adapterContractAddress),
    5,
    "couldn't find prices on chain"
  );
};

export const deployMockAdapter = async () => {
  await runWithLogPrefix(
    "yarn",
    [
      "hardhat",
      "--network",
      "localhost",
      "run",
      "test/monorepo-integration-tests/scripts/deploy-mock-adapter.ts",
    ],
    "deploy mock adapter",
    RELAYER_DIR
  );
  const adapterContractAddress = fs.readFileSync(
    `${RELAYER_DIR}/adapter-contract-address.txt`,
    "utf-8"
  );
  return adapterContractAddress;
};

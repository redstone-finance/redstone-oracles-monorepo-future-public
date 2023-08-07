import { ChildProcess } from "child_process";
import fs from "fs";
import {
  copyAndReplace,
  ExtraEnv,
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

export const buildRelayer = async () =>
  await installAndBuild(RELAYER_DIR, true);

export const startRelayer = (
  instance: RelayerInstance,
  adapterContractAddress: string,
  cacheServiceInstances: CacheLayerInstance[],
  isFallback: boolean
) => {
  const dotenvPath = `${RELAYER_DIR}/.env-${instance.instanceId}`;
  const cacheServiceUrls = cacheServiceInstances.map(
    (cacheLayerInstance) =>
      `http://localhost:${
        cacheLayerInstance.publicCacheServicePort ??
        cacheLayerInstance.directCacheServicePort
      }`
  );
  fs.copyFileSync(`${RELAYER_DIR}/.env.example`, dotenvPath);
  updateDotEnvFile("RPC_URL", "http://127.0.0.1:8545", dotenvPath);
  updateDotEnvFile("PRIVATE_KEY", HARDHAT_MOCK_PRIVATE_KEY, dotenvPath);
  updateDotEnvFile(
    "CACHE_SERVICE_URLS",
    JSON.stringify(cacheServiceUrls),
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
  updateDotEnvFile(
    "FALLBACK_OFFSET_IN_MINUTES",
    `${isFallback ? 2 : 0}`,
    dotenvPath
  );
  updateDotEnvFile(
    "HISTORICAL_PACKAGES_DATA_SERVICE_ID",
    "mock-data-service",
    dotenvPath
  );
  updateDotEnvFile(
    "HISTORICAL_PACKAGES_GATEWAYS",
    JSON.stringify(cacheServiceUrls),
    dotenvPath
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

const runHardhatScript = async (
  path: string,
  extraEnv: ExtraEnv,
  label: string,
  throwOnError = false
) =>
  await runWithLogPrefix(
    "yarn",
    ["hardhat", "--network", "localhost", "run", path],
    label,
    RELAYER_DIR,
    extraEnv,
    throwOnError
  );

const waitForPricesInAdapterCheck =
  (adapterContractAddress: string, expectedPrices: PriceSet) =>
  async (): Promise<boolean> =>
    await runHardhatScript(
      "test/monorepo-integration-tests/scripts/verify-mock-prices-in-adapter.ts",
      {
        ADAPTER_CONTRACT_ADDRESS: adapterContractAddress,
        PRICES_TO_CHECK: `${JSON.stringify(expectedPrices)}`,
      },
      "adapter-contract"
    );
const waitForPricesInPriceFeedCheck =
  (priceFeedContractAddress: string, expectedPrices: PriceSet) =>
  async (): Promise<boolean> =>
    await runHardhatScript(
      "test/monorepo-integration-tests/scripts/verify-mock-prices-in-price-feed.ts",
      {
        PRICE_FEED_CONTRACT_ADDRESS: priceFeedContractAddress,
        PRICES_TO_CHECK: `${JSON.stringify(expectedPrices)}`,
      },
      "price-feed-contract"
    );

export const verifyPricesOnChain = async (
  adapterContractAddress: string,
  priceFeedContractAddress: string,
  expectedPrices: PriceSet
) => {
  await waitForSuccess(
    waitForPricesInAdapterCheck(adapterContractAddress, expectedPrices),
    5,
    "couldn't find prices in adapter"
  );
  await waitForSuccess(
    waitForPricesInPriceFeedCheck(priceFeedContractAddress, expectedPrices),
    5,
    "couldn't find prices in price feed"
  );
};

export const verifyPricesNotOnChain = async (
  adapterContractAddress: string,
  priceFeedContractAddress: string,
  expectedPrices: PriceSet
) => {
  let exceptionOccurred = false;
  try {
    await verifyPricesOnChain(
      adapterContractAddress,
      priceFeedContractAddress,
      expectedPrices
    );
  } catch (e: unknown) {
    exceptionOccurred = true;
  }
  if (!exceptionOccurred) {
    throw new Error(
      "IMPOSSIBLE: prices were updated even though not expected. Most probably there is a bug in testing code."
    );
  }
};
export const deployMockAdapter = async () => {
  await runHardhatScript(
    "test/monorepo-integration-tests/scripts/deploy-mock-adapter.ts",
    {},
    "deploy mock adapter"
  );
  const adapterContractAddress = fs.readFileSync(
    `${RELAYER_DIR}/adapter-contract-address.txt`,
    "utf-8"
  );
  return adapterContractAddress;
};

export const deployMockPriceFeed = async (adapterContractAddress: string) => {
  await runHardhatScript(
    "test/monorepo-integration-tests/scripts/deploy-mock-price-feed.ts",
    { ADAPTER_CONTRACT_ADDRESS: adapterContractAddress },
    "deploy mock price feed"
  );
  const priceFeedContractAddress = fs.readFileSync(
    `${RELAYER_DIR}/price-feed-contract-address.txt`,
    "utf-8"
  );
  return priceFeedContractAddress;
};

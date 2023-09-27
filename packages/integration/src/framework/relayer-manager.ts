import { OnChainRelayerManifest } from "@redstone-finance/on-chain-relayer";
import { RedstoneCommon } from "@redstone-finance/utils";
import { ChildProcess } from "child_process";
import fs from "fs";
import { CacheLayerInstance } from "./cache-layer-manager";
import {
  ExtraEnv,
  PriceSet,
  printDotenv,
  runWithLogPrefix,
  runWithLogPrefixInBackground,
  stopChild,
  updateDotEnvFile,
  waitForSuccess,
} from "./integration-test-utils";

const HARDHAT_MOCK_PRIVATE_KEY =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RELAYER_DIR = "../on-chain-relayer";
const MANIFEST_PATH = "../integration/relayerManifest.json";

export type RelayerInstance = {
  relayerProcess?: ChildProcess;
  instanceId: string;
};

const getLogPrefix = (instance: RelayerInstance) =>
  `relayer-${instance.instanceId}`;

type RelayerConfig = {
  isFallback: boolean;
  adapterContractAddress: string;
  cacheServiceInstances: CacheLayerInstance[];
  intervalInMs?: number;
  updateTriggers?: {
    cron?: string[];
    deviationPercentage?: number;
    timeSinceLastUpdateInMilliseconds?: number;
  };
};

export const startRelayer = (
  instance: RelayerInstance,
  config: RelayerConfig
) => {
  const dotenvPath = `${RELAYER_DIR}/.env-${instance.instanceId}`;
  const cacheServiceUrls = config.cacheServiceInstances.map(
    (cacheLayerInstance) =>
      `http://localhost:${
        cacheLayerInstance.publicCacheServicePort ??
        cacheLayerInstance.directCacheServicePort
      }`
  );
  fs.copyFileSync(`${RELAYER_DIR}/.env.example`, dotenvPath);
  updateDotEnvFile("RPC_URLS", '["http://127.0.0.1:8545"]', dotenvPath);
  updateDotEnvFile("PRIVATE_KEY", HARDHAT_MOCK_PRIVATE_KEY, dotenvPath);
  updateDotEnvFile(
    "CACHE_SERVICE_URLS",
    JSON.stringify(cacheServiceUrls),
    dotenvPath
  );
  updateDotEnvFile("HEALTHCHECK_PING_URL", "", dotenvPath);
  createManifestFile({
    adapterContract: config.adapterContractAddress,
    updateTriggers: config.updateTriggers,
  });
  updateDotEnvFile("MANIFEST_FILE", MANIFEST_PATH, dotenvPath);
  if (config.intervalInMs) {
    updateDotEnvFile(
      "RELAYER_ITERATION_INTERVAL",
      config.intervalInMs.toString(),
      dotenvPath
    );
  }
  updateDotEnvFile(
    "FALLBACK_OFFSET_IN_MINUTES",
    `${config.isFallback ? 2 : 0}`,
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
  } catch (e) {
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

const createManifestFile = (
  manifestConfig: Partial<OnChainRelayerManifest>,
  path: string = MANIFEST_PATH
): void => {
  const sampleManifest = JSON.parse(
    fs.readFileSync("../integration/relayerManifestSample.json").toString()
  ) as Partial<OnChainRelayerManifest>;

  // prevent from overwriting with undefined
  if (!manifestConfig.updateTriggers) {
    manifestConfig.updateTriggers = sampleManifest.updateTriggers;
  }

  const manifest = { ...sampleManifest, ...manifestConfig };
  fs.writeFileSync(path, JSON.stringify(manifest));
};

export const waitForRelayerIterations = (
  relayerInstance: RelayerInstance,
  iterationsCount: number
): Promise<void> =>
  RedstoneCommon.timeout(
    new Promise((resolve, _reject) => {
      let count = 0;
      relayerInstance.relayerProcess?.stdout?.on("data", (log: string) => {
        if (log.includes("Update condition")) {
          if (++count >= iterationsCount) {
            resolve();
          }
        }
      });
    }),
    // it should normally occur in time defined in relayerSampleManifest.json which is set to ~10s
    120_000,
    "Failed to wait for relayer iteration. (Maybe log message has changed)"
  );

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
import {
  compileRelayerContracts,
  lazilyBuildTypescript,
  lazilyInstallNPMDeps,
} from "./integration-test-compile";
import { CacheLayerInstance } from "./cache-layer-manager";

const hardhatMockPrivateKey =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export type RelayerInstance = {
  relayerProcess?: ChildProcess;
  instanceId: string;
};

export const startRelayer = async (
  instance: RelayerInstance,
  adapterContractAddress: string,
  cacheLayerInstance: CacheLayerInstance
): Promise<void> => {
  process.chdir("../on-chain-relayer");
  await lazilyInstallNPMDeps();
  await compileRelayerContracts();
  await lazilyBuildTypescript();

  const dotenvPath = `.env-${instance.instanceId}`;
  fs.copyFileSync(".env.example", dotenvPath);
  updateDotEnvFile("RPC_URL", "http://127.0.0.1:8545", dotenvPath);
  updateDotEnvFile("PRIVATE_KEY", hardhatMockPrivateKey, dotenvPath);
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
    "yarn",
    ["start"],
    `on-chain-relayer-${instance.instanceId}`,
    { DOTENV_CONFIG_PATH: dotenvPath }
  );
};

export const stopRelayer = (relayer: RelayerInstance | undefined) => {
  stopChild(relayer?.relayerProcess, `on chain relayer-${relayer?.instanceId}`);
};

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

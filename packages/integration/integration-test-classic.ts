import { ChildProcess } from "child_process";
import fs from "fs";
import * as common from "./integration-test-common";

const hardhatMockPrivateKey =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

let hardhatNodeProcess: ChildProcess | undefined = undefined;
let onChainRelayerProcess: ChildProcess | undefined = undefined;

const stopAll = () => {
  console.log("stopAll called");
  common.stop(onChainRelayerProcess, "on chain relayer");
  onChainRelayerProcess = undefined;
  common.stop(hardhatNodeProcess, "hardhat node");
  hardhatNodeProcess = undefined;
  common.stopOracleNode();
  common.stopCacheLayer();
};

const main = async () => {
  process.env.MONOREPO_INTEGRATION_TEST = "true";
  await common.startAndWaitForCacheLayer();
  await common.startAndWaitForOracleNode();
  await common.waitForDataAndDisplayIt();
  await common.buildEvmConnector();

  // Compile on-chain-relayer
  process.chdir("../on-chain-relayer");
  await common.lazilyInstallNPMDeps();
  await common.runWithLogPrefix(
    "yarn",
    ["compile"],
    "compile relayer contracts"
  );
  await common.lazilyBuildTypescript();

  // Launch local EVM instance with hardhat
  hardhatNodeProcess = common.runWithLogPrefixInBackground(
    "yarn",
    ["start-node"],
    "hardhat-node"
  );
  await common.waitForUrl("127.0.0.1:8545"); // wait for hardhat to start blockchain instance
  await common.runWithLogPrefix(
    "yarn",
    [
      "hardhat",
      "--network",
      "localhost",
      "run",
      "test/monorepo-integration-tests/scripts/deploy-mock-adapter.ts",
    ],
    "deploy mock adapter"
  );
  const adapterContractAddress = fs.readFileSync(
    "adapter-contract-address.txt",
    "utf-8"
  );

  // Launch on-chain-relayer
  fs.copyFileSync(".env.example", ".env");
  common.updateDotEnvFile("RPC_URL", "http://127.0.0.1:8545");
  common.updateDotEnvFile("PRIVATE_KEY", hardhatMockPrivateKey);
  common.updateDotEnvFile("CACHE_SERVICE_URLS", '["http://localhost:3000"]');
  common.updateDotEnvFile("HEALTHCHECK_PING_URL", "");
  common.updateDotEnvFile(
    "MANIFEST_FILE",
    "../integration/relayerManifest.json"
  );
  common.copyAndReplace(
    /__ADAPTER_CONTRACT_ADDRESS__/,
    adapterContractAddress,
    "../integration/relayerManifestSample.json",
    "../integration/relayerManifest.json"
  );
  common.printDotenv("on chain relayer");
  process.env.ADAPTER_CONTRACT_ADDRESS = adapterContractAddress;

  onChainRelayerProcess = common.runWithLogPrefixInBackground(
    "yarn",
    ["start"],
    "on-chain-relayer"
  );

  const waitForPricesCheck = () =>
    common.runWithLogPrefix(
      "yarn",
      [
        "hardhat",
        "--network",
        "localhost",
        "run",
        "test/monorepo-integration-tests/scripts/verify-mock-prices.ts",
      ],
      "relayer-contract",
      false
    );
  // Verify prices on-chain
  common.waitForSuccess(waitForPricesCheck, 5, "couldn't find prices on chain");

  process.exit();
};

common.configureCleanup(stopAll);

main();

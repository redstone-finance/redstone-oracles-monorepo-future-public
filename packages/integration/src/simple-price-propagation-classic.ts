import fs from "fs";
import {
  buildEvmConnector,
  CacheLayerInstance,
  configureCleanup,
  HardhatInstance,
  OracleNodeInstance,
  RelayerInstance,
  runWithLogPrefix,
  setMockPrices,
  startAndWaitForCacheLayer,
  startAndWaitForHardHat,
  startAndWaitForOracleNode,
  startRelayer,
  stopCacheLayer,
  stopHardhat,
  stopOracleNode,
  stopRelayer,
  verifyPricesOnChain,
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const hardhatInstance: HardhatInstance = { instanceId: "1" };
const relayerInstance: RelayerInstance = { instanceId: "1" };
const cacheLayerInstance: CacheLayerInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  console.log("stopAll called");
  stopRelayer(relayerInstance);
  stopHardhat(hardhatInstance);
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance);
};

const deployMockAdapter = async () => {
  await runWithLogPrefix(
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
};

const main = async () => {
  await startAndWaitForCacheLayer(cacheLayerInstance, true);
  setMockPrices({
    BTC: 16000,
    ETH: 1500,
    __DEFAULT__: 42,
  });
  await startAndWaitForOracleNode(oracleNodeInstance, [cacheLayerInstance]);
  await waitForDataAndDisplayIt(cacheLayerInstance);
  await buildEvmConnector();

  await startAndWaitForHardHat(hardhatInstance);

  await deployMockAdapter();

  const adapterContractAddress = fs.readFileSync(
    "adapter-contract-address.txt",
    "utf-8"
  );
  await startRelayer(
    relayerInstance,
    adapterContractAddress,
    cacheLayerInstance
  );
  await verifyPricesOnChain(adapterContractAddress, {
    BTC: 16000,
    ETH: 1500,
    AAVE: 42,
  });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

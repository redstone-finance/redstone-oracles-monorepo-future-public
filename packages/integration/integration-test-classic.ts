import fs from "fs";
import {
  buildEvmConnector,
  CacheLayerInstance,
  configureCleanup,
  HardhatInstance,
  OracleNodeInstance,
  RelayerInstance,
  runWithLogPrefix,
  startAndWaitForCacheLayer,
  startAndWaitForHardHat,
  startAndWaitForOracleNode,
  startRelayer,
  stopCacheLayer,
  stopHardhat,
  stopOracleNode,
  stopRelayer,
  waitForDataAndDisplayIt,
  waitForSuccess,
} from "./integration-test-common";

let hardhatInstance: HardhatInstance | undefined = undefined;
let relayerInstance: RelayerInstance | undefined = undefined;
let cacheLayerInstance: CacheLayerInstance | undefined = undefined;
let oracleNodeInstance: OracleNodeInstance | undefined = undefined;

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
      { ADAPTER_CONTRACT_ADDRESS: adapterContractAddress },
      false
    );

const main = async () => {
  const cacheLayerInstanceId = "1";
  const oracleNodeInstanceId = "1";
  cacheLayerInstance = await startAndWaitForCacheLayer(cacheLayerInstanceId);
  oracleNodeInstance = await startAndWaitForOracleNode(
    oracleNodeInstanceId,
    cacheLayerInstance.cacheServicePort
  );
  await waitForDataAndDisplayIt(cacheLayerInstance);
  await buildEvmConnector();

  const hardhatInstanceId = "1";
  hardhatInstance = await startAndWaitForHardHat(hardhatInstanceId);

  await deployMockAdapter();

  const adapterContractAddress = fs.readFileSync(
    "adapter-contract-address.txt",
    "utf-8"
  );
  const relayerInstanceId = "1";
  relayerInstance = await startRelayer(
    relayerInstanceId,
    adapterContractAddress,
    cacheLayerInstance
  );

  // Verify prices on-chain
  await waitForSuccess(
    waitForPricesCheck(adapterContractAddress),
    5,
    "couldn't find prices on chain"
  );

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

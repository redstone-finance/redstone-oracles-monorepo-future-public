import {
  buildCacheLayer,
  buildEvmConnector,
  buildOracleNode,
  buildRelayer,
  CacheLayerInstance,
  configureCleanup,
  debug,
  deployMockAdapter,
  HardhatInstance,
  OracleNodeInstance,
  RelayerInstance,
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
  debug("stopAll called");
  stopRelayer(relayerInstance);
  stopHardhat(hardhatInstance);
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance);
};

const main = async () => {
  // setup
  await buildCacheLayer();
  await buildEvmConnector();
  await buildOracleNode();
  await buildRelayer();

  await startAndWaitForCacheLayer(cacheLayerInstance, true);
  setMockPrices({
    BTC: 16000,
    ETH: 1500,
    __DEFAULT__: 42,
  });
  await startAndWaitForOracleNode(oracleNodeInstance, [cacheLayerInstance]);
  await waitForDataAndDisplayIt(cacheLayerInstance);
  await startAndWaitForHardHat(hardhatInstance);

  const adapterContractAddress = await deployMockAdapter();

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

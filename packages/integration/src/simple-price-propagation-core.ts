import {
  buildEvmConnector,
  CacheLayerInstance,
  configureCleanup,
  OracleNodeInstance,
  setMockPrices,
  startAndWaitForCacheLayer,
  startAndWaitForOracleNode,
  stopCacheLayer,
  stopOracleNode,
  verifyPricesInCacheService,
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const cacheLayerInstance: CacheLayerInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  console.log("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance);
};

const main = async () => {
  setMockPrices({ __DEFAULT__: 42 });
  await startAndWaitForCacheLayer(cacheLayerInstance, true);
  await startAndWaitForOracleNode(oracleNodeInstance, [cacheLayerInstance]);
  await waitForDataAndDisplayIt(cacheLayerInstance);
  await buildEvmConnector();
  await verifyPricesInCacheService([cacheLayerInstance], { BTC: 42 });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

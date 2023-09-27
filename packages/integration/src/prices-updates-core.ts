import {
  CacheLayerInstance,
  configureCleanup,
  debug,
  OracleNodeInstance,
  setMockPrices,
  startAndWaitForCacheLayer,
  startAndWaitForOracleNode,
  stopCacheLayer,
  stopOracleNode,
  verifyPricesInCacheService,
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const cacheLayerInstance1: CacheLayerInstance = { instanceId: "1" };
const cacheLayerInstance2: CacheLayerInstance = { instanceId: "2" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance1);
  stopCacheLayer(cacheLayerInstance2);
};

const main = async () => {
  setMockPrices({ __DEFAULT__: 42 }, oracleNodeInstance);
  await startAndWaitForCacheLayer(cacheLayerInstance1, false);
  await startAndWaitForCacheLayer(cacheLayerInstance2, false);
  await startAndWaitForOracleNode(oracleNodeInstance, [
    cacheLayerInstance1,
    cacheLayerInstance2,
  ]);
  await waitForDataAndDisplayIt(cacheLayerInstance1);
  await verifyPricesInCacheService([cacheLayerInstance1, cacheLayerInstance2], {
    BTC: 42,
  });
  setMockPrices({ __DEFAULT__: 43 }, oracleNodeInstance);
  await verifyPricesInCacheService([cacheLayerInstance1, cacheLayerInstance2], {
    BTC: 43,
  });
  setMockPrices({ __DEFAULT__: 44 }, oracleNodeInstance);
  await verifyPricesInCacheService([cacheLayerInstance1, cacheLayerInstance2], {
    BTC: 44,
  });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

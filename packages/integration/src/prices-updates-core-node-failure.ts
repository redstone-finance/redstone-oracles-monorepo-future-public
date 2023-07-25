import {
  buildEvmConnector,
  CacheLayerInstance,
  configureCleanup,
  OracleNodeInstance,
  setMockPrices,
  startAndWaitForCacheLayer,
  startAndWaitForOracleNode,
  startDirectAndPublicCacheServices,
  stopCacheLayer,
  stopDirectAndPublicCacheServices,
  stopOracleNode,
  verifyPricesInCacheService,
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const cacheLayerInstance1: CacheLayerInstance = { instanceId: "1" };
const cacheLayerInstance2: CacheLayerInstance = { instanceId: "2" };
const oracleNodeInstance1: OracleNodeInstance = { instanceId: "1" };
const oracleNodeInstance2: OracleNodeInstance = { instanceId: "2" };
const oracleNodeInstance3: OracleNodeInstance = { instanceId: "3" };

const stopAll = () => {
  console.log("stopAll called");
  stopOracleNode(oracleNodeInstance1);
  stopOracleNode(oracleNodeInstance2);
  stopOracleNode(oracleNodeInstance3);
  stopCacheLayer(cacheLayerInstance1);
  stopCacheLayer(cacheLayerInstance2);
};

const main = async () => {
  const allCacheLayers = [cacheLayerInstance1, cacheLayerInstance2];
  setMockPrices({ __DEFAULT__: 42 });

  // setup
  await startAndWaitForCacheLayer(cacheLayerInstance1, false);
  await startAndWaitForCacheLayer(cacheLayerInstance2, false);
  await startAndWaitForOracleNode(oracleNodeInstance1, [
    cacheLayerInstance1,
    cacheLayerInstance2,
  ]);
  await startAndWaitForOracleNode(oracleNodeInstance2, [
    cacheLayerInstance1,
    cacheLayerInstance2,
  ]);
  await startAndWaitForOracleNode(oracleNodeInstance3, [
    cacheLayerInstance1,
    cacheLayerInstance2,
  ]);
  await waitForDataAndDisplayIt(cacheLayerInstance1);
  await buildEvmConnector();

  // verify everything works
  await verifyPricesInCacheService(allCacheLayers, { BTC: 42 });

  // stop single oracle node and cache service and verify everything works
  stopOracleNode(oracleNodeInstance1);
  stopDirectAndPublicCacheServices(cacheLayerInstance1);
  setMockPrices({ __DEFAULT__: 43 });
  await verifyPricesInCacheService(allCacheLayers, { BTC: 43 });

  // start stopped cache service, stop another one and verify everything works
  await startDirectAndPublicCacheServices(cacheLayerInstance1);
  stopDirectAndPublicCacheServices(cacheLayerInstance2);
  setMockPrices({ __DEFAULT__: 44 });
  await verifyPricesInCacheService(allCacheLayers, { BTC: 44 });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

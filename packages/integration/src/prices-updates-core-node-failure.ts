import {
  buildCacheLayer,
  buildEvmConnector,
  buildOracleNode,
  CacheLayerInstance,
  configureCleanup,
  debug,
  OracleNodeInstance,
  setMockPrices,
  startAndWaitForCacheLayer,
  startAndWaitForOracleNode,
  startDirectAndPublicCacheServices,
  stopCacheLayer,
  stopDirectAndPublicCacheServices,
  stopOracleNode,
  verifyPricesInCacheService,
  verifyPricesNotInCacheService,
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const cacheLayerInstance1: CacheLayerInstance = { instanceId: "1" };
const cacheLayerInstance2: CacheLayerInstance = { instanceId: "2" };
const oracleNodeInstance1: OracleNodeInstance = { instanceId: "1" };
const oracleNodeInstance2: OracleNodeInstance = { instanceId: "2" };
const oracleNodeInstance3: OracleNodeInstance = { instanceId: "3" };

const stopAll = () => {
  debug("stopAll called");
  stopOracleNode(oracleNodeInstance1);
  stopOracleNode(oracleNodeInstance2);
  stopOracleNode(oracleNodeInstance3);
  stopCacheLayer(cacheLayerInstance1);
  stopCacheLayer(cacheLayerInstance2);
};

const main = async () => {
  // setup
  await buildCacheLayer();
  await buildEvmConnector();
  await buildOracleNode();

  const allCacheLayers = [cacheLayerInstance1, cacheLayerInstance2];
  setMockPrices({ __DEFAULT__: 42 });

  await startAndWaitForCacheLayer(cacheLayerInstance1, false);
  await startAndWaitForCacheLayer(cacheLayerInstance2, false);
  await startAndWaitForOracleNode(oracleNodeInstance1, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance2, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance3, allCacheLayers);
  await waitForDataAndDisplayIt(cacheLayerInstance1);

  // verify everything works
  await verifyPricesInCacheService(allCacheLayers, { BTC: 42 });

  // stop single oracle node and cache service and verify everything works
  stopOracleNode(oracleNodeInstance1);
  stopDirectAndPublicCacheServices(cacheLayerInstance1);
  setMockPrices({ __DEFAULT__: 43 });
  await verifyPricesInCacheService(allCacheLayers, { BTC: 43 });

  // stop all nodes and verify that prices are not being updated
  stopOracleNode(oracleNodeInstance2);
  stopOracleNode(oracleNodeInstance3);
  setMockPrices({ __DEFAULT__: 44 });
  await verifyPricesNotInCacheService(allCacheLayers, { BTC: 44 });

  // start stopped cache service, stop another one and verify everything works
  await startAndWaitForOracleNode(oracleNodeInstance2, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance3, allCacheLayers);
  await startDirectAndPublicCacheServices(cacheLayerInstance1);
  stopDirectAndPublicCacheServices(cacheLayerInstance2);
  setMockPrices({ __DEFAULT__: 45 });
  await verifyPricesInCacheService(allCacheLayers, { BTC: 45 });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

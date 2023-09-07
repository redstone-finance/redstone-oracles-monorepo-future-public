import {
  buildCacheLayer,
  buildEvmConnector,
  buildOracleNode,
  buildRelayer,
  CacheLayerInstance,
  configureCleanup,
  debug,
  deployMockAdapter,
  deployMockPriceFeed,
  HardhatInstance,
  OracleNodeInstance,
  PriceSet,
  setMockPrices,
  sleep,
  startAndWaitForCacheLayer,
  startAndWaitForHardHat,
  startAndWaitForOracleNode,
  startDirectAndPublicCacheServices,
  startRelayer,
  stopCacheLayer,
  stopDirectAndPublicCacheServices,
  stopHardhat,
  stopOracleNode,
  stopRelayer,
  verifyPricesInCacheService,
  verifyPricesNotInCacheService,
  verifyPricesNotOnChain,
  verifyPricesOnChain,
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const cacheLayerInstance1: CacheLayerInstance = { instanceId: "1" };
const cacheLayerInstance2: CacheLayerInstance = { instanceId: "2" };
const oracleNodeInstance1: OracleNodeInstance = { instanceId: "1" };
const oracleNodeInstance2: OracleNodeInstance = { instanceId: "2" };
const oracleNodeInstance3: OracleNodeInstance = { instanceId: "3" };
const relayerInstanceMain: OracleNodeInstance = { instanceId: "main" };
const relayerInstanceFallback: OracleNodeInstance = { instanceId: "fallback" };
const hardhatInstance: HardhatInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopRelayer(relayerInstanceMain);
  stopRelayer(relayerInstanceFallback);
  stopHardhat(hardhatInstance);
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
  await buildRelayer();

  const allCacheLayers = [cacheLayerInstance1, cacheLayerInstance2];
  setMockPrices({ __DEFAULT__: 42 });
  let expectedPrices: PriceSet = { BTC: 42 };

  await startAndWaitForCacheLayer(cacheLayerInstance1, false);
  await startAndWaitForCacheLayer(cacheLayerInstance2, false);
  await startAndWaitForOracleNode(oracleNodeInstance1, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance2, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance3, allCacheLayers);
  await waitForDataAndDisplayIt(cacheLayerInstance1);
  await waitForDataAndDisplayIt(cacheLayerInstance2);
  await startAndWaitForHardHat(hardhatInstance);
  const adapterContractAddress = await deployMockAdapter();
  const priceFeedContractAddress = await deployMockPriceFeed(
    adapterContractAddress
  );
  startRelayer(
    relayerInstanceMain,
    adapterContractAddress,
    allCacheLayers,
    false
  );
  startRelayer(
    relayerInstanceFallback,
    adapterContractAddress,
    allCacheLayers,
    true
  );

  // verify everything works
  await verifyPricesInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesOnChain(
    adapterContractAddress,
    priceFeedContractAddress,
    expectedPrices
  );

  // stop single oracle node and cache service and verify everything works
  stopOracleNode(oracleNodeInstance1);
  stopDirectAndPublicCacheServices(cacheLayerInstance1);
  setMockPrices({ __DEFAULT__: 43 });
  expectedPrices = { BTC: 43 };
  await verifyPricesInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesOnChain(
    adapterContractAddress,
    priceFeedContractAddress,
    expectedPrices
  );

  // stop all nodes and verify that prices are not being updated
  stopOracleNode(oracleNodeInstance2);
  stopOracleNode(oracleNodeInstance3);
  setMockPrices({ __DEFAULT__: 44 });
  expectedPrices = { BTC: 44 };
  await verifyPricesNotInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesNotOnChain(
    adapterContractAddress,
    priceFeedContractAddress,
    expectedPrices
  );

  // start stopped nodes and cache service, stop another cache service one and verify if everything works
  await startAndWaitForOracleNode(oracleNodeInstance2, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance3, allCacheLayers);
  await startDirectAndPublicCacheServices(cacheLayerInstance1);
  stopDirectAndPublicCacheServices(cacheLayerInstance2);
  setMockPrices({ __DEFAULT__: 45 });
  expectedPrices = { BTC: 45 };
  await verifyPricesInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesOnChain(
    adapterContractAddress,
    priceFeedContractAddress,
    expectedPrices
  );

  // stop main relayer and verify that prices are not updated...
  stopRelayer(relayerInstanceMain);
  setMockPrices({ __DEFAULT__: 46 });
  expectedPrices = { BTC: 46 };
  await verifyPricesInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesNotOnChain(
    adapterContractAddress,
    priceFeedContractAddress,
    expectedPrices
  );
  await sleep(100_000); // fallback relayer delay is 120 seconds and verifyPricesNotOnChain takes 4*5 = 20 seconds

  // ... unless fallback relayer kicks in
  await verifyPricesOnChain(
    adapterContractAddress,
    priceFeedContractAddress,
    expectedPrices
  );

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

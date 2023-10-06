import { RedstoneCommon } from "@redstone-finance/utils";
import {
  CacheLayerInstance,
  configureCleanup,
  debug,
  deployMockAdapter,
  deployMockPriceFeed,
  HardhatInstance,
  OracleNodeInstance,
  PriceSet,
  setMockPricesMany,
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

const allOracleNodeInstances = [
  oracleNodeInstance1,
  oracleNodeInstance2,
  oracleNodeInstance3,
];

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
  const allCacheLayers = [cacheLayerInstance1, cacheLayerInstance2];
  setMockPricesMany({ __DEFAULT__: 42 }, allOracleNodeInstances);
  let expectedPrices: PriceSet = { BTC: 42 };

  await startAndWaitForCacheLayer(cacheLayerInstance1, {
    directOnly: false,
    enableHistoricalDataServing: true,
  });
  await startAndWaitForCacheLayer(cacheLayerInstance2, {
    directOnly: false,
    enableHistoricalDataServing: true,
  });
  await startAndWaitForOracleNode(oracleNodeInstance1, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance2, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance3, allCacheLayers);
  await waitForDataAndDisplayIt(cacheLayerInstance1);
  await waitForDataAndDisplayIt(cacheLayerInstance2);
  await startAndWaitForHardHat(hardhatInstance);

  const adapterContract = await deployMockAdapter();
  const adapterContractAddress = adapterContract.address;
  const priceFeedContract = await deployMockPriceFeed(adapterContractAddress);

  startRelayer(relayerInstanceMain, {
    cacheServiceInstances: allCacheLayers,
    adapterContractAddress,
    isFallback: false,
  });
  startRelayer(relayerInstanceFallback, {
    cacheServiceInstances: allCacheLayers,
    adapterContractAddress,
    isFallback: true,
  });

  // verify everything works
  await verifyPricesInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesOnChain(adapterContract, priceFeedContract, expectedPrices);

  // stop single oracle node and cache service and verify everything works
  stopOracleNode(oracleNodeInstance1);
  stopDirectAndPublicCacheServices(cacheLayerInstance1);
  setMockPricesMany({ __DEFAULT__: 43 }, allOracleNodeInstances);
  expectedPrices = { BTC: 43 };
  await verifyPricesInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesOnChain(adapterContract, priceFeedContract, expectedPrices);

  // stop all nodes and verify that prices are not being updated
  stopOracleNode(oracleNodeInstance2);
  stopOracleNode(oracleNodeInstance3);
  setMockPricesMany({ __DEFAULT__: 44 }, allOracleNodeInstances);
  expectedPrices = { BTC: 44 };
  await verifyPricesNotInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesNotOnChain(
    adapterContract,
    priceFeedContract,
    expectedPrices
  );

  // start stopped nodes and cache service, stop another cache service one and verify if everything works
  await startAndWaitForOracleNode(oracleNodeInstance2, allCacheLayers);
  await startAndWaitForOracleNode(oracleNodeInstance3, allCacheLayers);
  await startDirectAndPublicCacheServices(cacheLayerInstance1);
  stopDirectAndPublicCacheServices(cacheLayerInstance2);
  setMockPricesMany({ __DEFAULT__: 45 }, allOracleNodeInstances);
  expectedPrices = { BTC: 45 };
  await verifyPricesInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesOnChain(adapterContract, priceFeedContract, expectedPrices);

  // stop main relayer and verify that prices are not updated...
  stopRelayer(relayerInstanceMain);
  setMockPricesMany({ __DEFAULT__: 46 }, allOracleNodeInstances);
  expectedPrices = { BTC: 46 };
  await verifyPricesInCacheService(allCacheLayers, expectedPrices);
  await verifyPricesNotOnChain(
    adapterContract,
    priceFeedContract,
    expectedPrices
  );
  await RedstoneCommon.sleep(100_000); // fallback relayer delay is 120 seconds and verifyPricesNotOnChain takes 4*5 = 20 seconds

  // ... unless fallback relayer kicks in
  await verifyPricesOnChain(adapterContract, priceFeedContract, expectedPrices);

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

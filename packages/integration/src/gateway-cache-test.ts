// cache works
// can query historical data-packages

import { RedstoneCommon } from "@redstone-finance/utils";
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
  waitForDataAndDisplayIt as waitForDataInMongoDb,
} from "./framework/integration-test-framework";

const cacheLayerInstance: CacheLayerInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance);
};

const CACHE_TTL = 100_000;

/**
 * We are setting very high ttl 30 seconds
 * Then updating price, we should still fetch old value cause of CATCH
 * After TTL we should be able to query new value
 */
const main = async () => {
  setMockPrices({ __DEFAULT__: 42 }, oracleNodeInstance);
  await startAndWaitForCacheLayer(cacheLayerInstance, {
    dataPackagesTtl: CACHE_TTL,
    enableHistoricalDataServing: false,
    directOnly: true,
  });
  await startAndWaitForOracleNode(oracleNodeInstance, [cacheLayerInstance]);
  await waitForDataInMongoDb(cacheLayerInstance);
  const cacheStart = Date.now();
  await verifyPricesInCacheService([cacheLayerInstance], { BTC: 42 });

  setMockPrices({ __DEFAULT__: 45 }, oracleNodeInstance);
  await waitForDataInMongoDb(cacheLayerInstance, 2);
  await verifyPricesInCacheService([cacheLayerInstance], { BTC: 42 });

  const timePassed = Date.now() - cacheStart;
  await RedstoneCommon.sleep(CACHE_TTL - timePassed);
  await verifyPricesInCacheService([cacheLayerInstance], { BTC: 45 });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

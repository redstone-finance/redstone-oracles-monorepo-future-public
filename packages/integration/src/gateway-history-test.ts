// cache works
// can query historical data-packages

import axios from "axios";
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
import assert from "assert";

const cacheLayerInstance: CacheLayerInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance);
};

/**
 * We are setting very high ttl 30 seconds
 * Then updating price, we should still fetch old value cause of CATCH
 * After TTL we should be able to query new value
 */
const main = async () => {
  setMockPrices({ __DEFAULT__: 42 }, oracleNodeInstance);
  await startAndWaitForCacheLayer(cacheLayerInstance, true, true);
  await startAndWaitForOracleNode(oracleNodeInstance, [cacheLayerInstance]);
  await waitForDataInMongoDb(cacheLayerInstance);
  await verifyPricesInCacheService([cacheLayerInstance], { BTC: 42 });

  const latestResponse = await axios.get<{
    AAVE: { timestampMilliseconds: number }[];
  }>(
    `http://localhost:${cacheLayerInstance.directCacheServicePort}/data-packages/latest/mock-data-service`
  );

  const lastTimestamp = latestResponse.data["AAVE"][0].timestampMilliseconds;
  if (!lastTimestamp) {
    throw new Error(`Failed to fetch data-packages`);
  }

  setMockPrices({ __DEFAULT__: 45 }, oracleNodeInstance);
  await waitForDataInMongoDb(cacheLayerInstance, 2);
  await verifyPricesInCacheService([cacheLayerInstance], { BTC: 45 });

  const historyResponse = await axios.get<{
    AAVE: { timestampMilliseconds: number };
  }>(
    `http://localhost:${cacheLayerInstance.directCacheServicePort}/data-packages/historical/mock-data-service/${lastTimestamp}`
  );

  assert.deepEqual(
    latestResponse.data,
    historyResponse.data,
    `Historical response doesn't match /latest response from same point in past`
  );

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

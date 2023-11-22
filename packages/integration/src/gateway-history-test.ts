// cache works
// can query historical data-packages

import assert from "assert";
import axios from "axios";
import {
  configureCleanup,
  debug,
  GatewayInstance,
  getCacheServicePort,
  OracleNodeInstance,
  setMockPrices,
  startAndWaitForGateway,
  startAndWaitForOracleNode,
  stopGateway,
  stopOracleNode,
  verifyPricesInCacheService,
  waitForDataAndDisplayIt as waitForDataInMongoDb,
} from "./framework/integration-test-framework";

const gatewayInstance: GatewayInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopGateway(gatewayInstance);
};

/**
 * We are setting very high ttl 30 seconds
 * Then updating price, we should still fetch old value cause of CATCH
 * After TTL we should be able to query new value
 */
const main = async () => {
  setMockPrices({ __DEFAULT__: 42 }, oracleNodeInstance);
  await startAndWaitForGateway(gatewayInstance, {
    directOnly: true,
    enableHistoricalDataServing: true,
  });
  await startAndWaitForOracleNode(oracleNodeInstance, [gatewayInstance]);
  await waitForDataInMongoDb(gatewayInstance);
  await verifyPricesInCacheService([gatewayInstance], { BTC: 42 });

  const latestResponse = await axios.get<{
    AAVE: { timestampMilliseconds: number }[];
  }>(
    `http://localhost:${getCacheServicePort(
      gatewayInstance,
      "direct"
    )}/data-packages/latest/mock-data-service`
  );

  const lastTimestamp = latestResponse.data["AAVE"][0].timestampMilliseconds;
  if (!lastTimestamp) {
    throw new Error(`Failed to fetch data-packages`);
  }

  setMockPrices({ __DEFAULT__: 45 }, oracleNodeInstance);
  await waitForDataInMongoDb(gatewayInstance, 2);
  await verifyPricesInCacheService([gatewayInstance], { BTC: 45 });

  const historyResponse = await axios.get<{
    AAVE: { timestampMilliseconds: number };
  }>(
    `http://localhost:${getCacheServicePort(
      gatewayInstance,
      "direct"
    )}/data-packages/historical/mock-data-service/${lastTimestamp}`
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

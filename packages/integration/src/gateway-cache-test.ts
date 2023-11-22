// cache works
// can query historical data-packages

import { RedstoneCommon } from "@redstone-finance/utils";
import {
  configureCleanup,
  debug,
  GatewayInstance,
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

const CACHE_TTL = 100_000;

/**
 * We are setting very high ttl 30 seconds
 * Then updating price, we should still fetch old value cause of CATCH
 * After TTL we should be able to query new value
 */
const main = async () => {
  setMockPrices({ __DEFAULT__: 42 }, oracleNodeInstance);
  await startAndWaitForGateway(gatewayInstance, {
    dataPackagesTtl: CACHE_TTL,
    enableHistoricalDataServing: false,
    directOnly: true,
  });
  await startAndWaitForOracleNode(oracleNodeInstance, [gatewayInstance]);
  await waitForDataInMongoDb(gatewayInstance);
  const cacheStart = Date.now();
  await verifyPricesInCacheService([gatewayInstance], { BTC: 42 });

  setMockPrices({ __DEFAULT__: 45 }, oracleNodeInstance);
  await waitForDataInMongoDb(gatewayInstance, 2);
  await verifyPricesInCacheService([gatewayInstance], { BTC: 42 });

  const timePassed = Date.now() - cacheStart;
  await RedstoneCommon.sleep(CACHE_TTL - timePassed);
  await verifyPricesInCacheService([gatewayInstance], { BTC: 45 });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

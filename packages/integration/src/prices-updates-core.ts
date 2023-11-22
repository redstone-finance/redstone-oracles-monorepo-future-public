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
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const gatewayInstance1: GatewayInstance = { instanceId: "1" };
const gatewayInstance2: GatewayInstance = { instanceId: "2" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopGateway(gatewayInstance1);
  stopGateway(gatewayInstance2);
};

const main = async () => {
  setMockPrices({ __DEFAULT__: 42 }, oracleNodeInstance);
  await startAndWaitForGateway(gatewayInstance1, { directOnly: false });
  await startAndWaitForGateway(gatewayInstance2, { directOnly: false });
  await startAndWaitForOracleNode(oracleNodeInstance, [
    gatewayInstance1,
    gatewayInstance2,
  ]);
  await waitForDataAndDisplayIt(gatewayInstance1);
  await verifyPricesInCacheService([gatewayInstance1, gatewayInstance2], {
    BTC: 42,
  });
  setMockPrices({ __DEFAULT__: 43 }, oracleNodeInstance);
  await verifyPricesInCacheService([gatewayInstance1, gatewayInstance2], {
    BTC: 43,
  });
  setMockPrices({ __DEFAULT__: 44 }, oracleNodeInstance);
  await verifyPricesInCacheService([gatewayInstance1, gatewayInstance2], {
    BTC: 44,
  });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

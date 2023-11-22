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

const gatewayInstance: GatewayInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopGateway(gatewayInstance);
};

const main = async () => {
  setMockPrices({ __DEFAULT__: 42 }, oracleNodeInstance);
  await startAndWaitForGateway(gatewayInstance, { directOnly: true });
  await startAndWaitForOracleNode(oracleNodeInstance, [gatewayInstance]);
  await waitForDataAndDisplayIt(gatewayInstance);
  await verifyPricesInCacheService([gatewayInstance], { BTC: 42 });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

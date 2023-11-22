import {
  configureCleanup,
  debug,
  OracleNodeInstance,
  RedstoneCacheLayerInstance,
  setMockPrices,
  startAndWaitForOracleNodeForRedstoneCacheLayer,
  startAndWaitForRedstoneCacheLayer,
  stopOracleNode,
  stopRedstoneCacheLayer,
  verifyPricesInRedstoneCacheLayer,
  waitForDataInRedstoneCacheLayerAndDisplayIt,
} from "./framework/integration-test-framework";

const gatewayInstance: RedstoneCacheLayerInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopRedstoneCacheLayer(gatewayInstance);
};

const main = async () => {
  setMockPrices({ __DEFAULT__: 42, ETH: 34 }, oracleNodeInstance);
  await startAndWaitForRedstoneCacheLayer(gatewayInstance);
  await startAndWaitForOracleNodeForRedstoneCacheLayer(oracleNodeInstance, [
    gatewayInstance,
  ]);
  await waitForDataInRedstoneCacheLayerAndDisplayIt(gatewayInstance);
  await verifyPricesInRedstoneCacheLayer(gatewayInstance, {
    BTC: 42,
    ETH: 34,
    AAVE: 42,
  });

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

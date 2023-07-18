import * as common from "./integration-test-common";

const stopAll = () => {
  console.log("stopAll called");
  common.stopOracleNode();
  common.stopCacheLayer();
};

const main = async () => {
  process.env.MONOREPO_INTEGRATION_TEST = "true";
  await common.startAndWaitForCacheLayer();
  await common.startAndWaitForOracleNode();
  await common.waitForDataAndDisplayIt();
  await common.buildEvmConnector();
  await common.runWithLogPrefix("yarn", ["test", "test/monorepo-integration-tests/localhost-mock.test.ts"], "evm-connector");

  process.exit();
}

common.configureCleanup(stopAll);

main();

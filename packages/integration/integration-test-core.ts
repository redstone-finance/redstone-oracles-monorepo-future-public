import {
  buildEvmConnector,
  CacheLayerInstance,
  configureCleanup,
  OracleNodeInstance,
  runWithLogPrefix,
  startAndWaitForCacheLayer,
  startAndWaitForOracleNode,
  stopCacheLayer,
  stopOracleNode,
  waitForDataAndDisplayIt,
} from "./integration-test-common";

let cacheLayerInstance: CacheLayerInstance | undefined = undefined;
let oracleNodeInstance: OracleNodeInstance | undefined = undefined;

const stopAll = () => {
  console.log("stopAll called");
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance);
};

const main = async () => {
  const cacheLayerInstanceId = "1";
  const oracleNodeInstanceId = "1";
  cacheLayerInstance = await startAndWaitForCacheLayer(cacheLayerInstanceId);
  oracleNodeInstance = await startAndWaitForOracleNode(
    oracleNodeInstanceId,
    cacheLayerInstance.cacheServicePort
  );
  await waitForDataAndDisplayIt(cacheLayerInstance);
  await buildEvmConnector();
  await runWithLogPrefix(
    "yarn",
    ["test", "test/monorepo-integration-tests/localhost-mock.test.ts"],
    "evm-connector",
    {
      MONOREPO_INTEGRATION_TEST: "true",
      CACHE_SERVICE_URLS: `["http://localhost:${cacheLayerInstance.cacheServicePort}"]`,
    }
  );

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

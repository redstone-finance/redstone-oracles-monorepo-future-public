import {
  CacheLayerInstance,
  configureCleanup,
  debug,
  deployMockAdapter,
  deployMockPriceFeed,
  HardhatInstance,
  OracleNodeInstance,
  RelayerInstance,
  setMockPrices,
  startAndWaitForCacheLayer,
  startAndWaitForHardHat,
  startAndWaitForOracleNode,
  startRelayer,
  stopCacheLayer,
  stopHardhat,
  stopOracleNode,
  stopRelayer,
  verifyPricesOnChain,
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const hardhatInstance: HardhatInstance = { instanceId: "1" };
const relayerInstance: RelayerInstance = { instanceId: "1" };
const cacheLayerInstance: CacheLayerInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopRelayer(relayerInstance);
  stopHardhat(hardhatInstance);
  stopOracleNode(oracleNodeInstance);
  stopCacheLayer(cacheLayerInstance);
};

const main = async () => {
  await startAndWaitForCacheLayer(cacheLayerInstance, true);
  setMockPrices(
    {
      BTC: 16000,
      ETH: 1500,
      __DEFAULT__: 42,
    },
    oracleNodeInstance
  );
  await startAndWaitForOracleNode(oracleNodeInstance, [cacheLayerInstance]);
  await waitForDataAndDisplayIt(cacheLayerInstance);
  await startAndWaitForHardHat(hardhatInstance);

  const adapterContract = await deployMockAdapter();
  const adapterContractAddress = adapterContract.address;
  const priceFeedContract = await deployMockPriceFeed(adapterContractAddress);

  startRelayer(relayerInstance, {
    adapterContractAddress,
    cacheServiceInstances: [cacheLayerInstance],
    isFallback: false,
  });

  await verifyPricesOnChain(adapterContract, priceFeedContract, {
    BTC: 16000,
    ETH: 1500,
    AAVE: 42,
  });

  process.exit();
};

configureCleanup(stopAll);

void main();

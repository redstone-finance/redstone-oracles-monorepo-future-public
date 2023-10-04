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
  waitForRelayerIterations,
} from "../framework/integration-test-framework";

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
  await startAndWaitForCacheLayer(cacheLayerInstance, { directOnly: true });
  setMockPrices(
    {
      BTC: 16000,
      __DEFAULT__: 42,
    },
    oracleNodeInstance
  );
  await startAndWaitForOracleNode(oracleNodeInstance, [cacheLayerInstance]);
  await waitForDataAndDisplayIt(cacheLayerInstance);
  await startAndWaitForHardHat(hardhatInstance);

  const adapterContract = await deployMockAdapter();
  const priceFeedContract = await deployMockPriceFeed(adapterContract.address);

  startRelayer(relayerInstance, {
    cacheServiceInstances: [cacheLayerInstance],
    adapterContractAddress: adapterContract.address,
    isFallback: false,
  });
  await verifyPricesOnChain(adapterContract, priceFeedContract, {
    BTC: 16000,
  });
  // end of updating first prices

  //restart relayer with condition on value deviation 10%
  stopRelayer(relayerInstance);
  startRelayer(relayerInstance, {
    cacheServiceInstances: [cacheLayerInstance],
    adapterContractAddress: adapterContract.address,
    updateTriggers: {
      deviationPercentage: 10,
    },
    isFallback: false,
  });

  //simulate 10.1% deviation
  const valueWithGoodDeviation = 16000 + 16000 * 0.101;
  setMockPrices(
    {
      BTC: valueWithGoodDeviation,
      __DEFAULT__: 42 + 42 * 0.01,
    },
    oracleNodeInstance
  );
  await waitForDataAndDisplayIt(cacheLayerInstance, 2);
  await waitForRelayerIterations(relayerInstance, 1);
  await verifyPricesOnChain(adapterContract, priceFeedContract, {
    BTC: valueWithGoodDeviation,
    ETH: 42 + 42 * 0.01,
  });

  // when deviation is lower then 10% values should not be changed
  const valueWithTooLowDeviation =
    valueWithGoodDeviation + valueWithGoodDeviation * 0.05;
  setMockPrices(
    {
      BTC: valueWithTooLowDeviation,
      __DEFAULT__: 42 + 42 * 0.01,
    },
    oracleNodeInstance
  );
  await waitForDataAndDisplayIt(cacheLayerInstance, 3);
  await waitForRelayerIterations(relayerInstance, 1);
  await verifyPricesOnChain(adapterContract, priceFeedContract, {
    BTC: valueWithGoodDeviation,
  });

  process.exit();
};

configureCleanup(stopAll);

void main();

import {
  configureCleanup,
  debug,
  deployMockAdapter,
  deployMockPriceFeed,
  GatewayInstance,
  HardhatInstance,
  OracleNodeInstance,
  RelayerInstance,
  setMockPrices,
  startAndWaitForGateway,
  startAndWaitForHardHat,
  startAndWaitForOracleNode,
  startRelayer,
  stopGateway,
  stopHardhat,
  stopOracleNode,
  stopRelayer,
  verifyPricesOnChain,
  waitForDataAndDisplayIt,
  waitForRelayerIterations,
} from "../framework/integration-test-framework";

const hardhatInstance: HardhatInstance = { instanceId: "1" };
const relayerInstance: RelayerInstance = { instanceId: "1" };
const gatewayInstance: GatewayInstance = { instanceId: "1" };
const oracleNodeInstance: OracleNodeInstance = { instanceId: "1" };

const stopAll = () => {
  debug("stopAll called");
  stopRelayer(relayerInstance);
  stopHardhat(hardhatInstance);
  stopOracleNode(oracleNodeInstance);
  stopGateway(gatewayInstance);
};

const main = async () => {
  await startAndWaitForGateway(gatewayInstance, { directOnly: true });
  setMockPrices(
    {
      BTC: 16000,
      __DEFAULT__: 42,
    },
    oracleNodeInstance
  );
  await startAndWaitForOracleNode(oracleNodeInstance, [gatewayInstance]);
  await waitForDataAndDisplayIt(gatewayInstance);
  await startAndWaitForHardHat(hardhatInstance);

  const adapterContract = await deployMockAdapter();
  const priceFeedContract = await deployMockPriceFeed(adapterContract.address);

  startRelayer(relayerInstance, {
    cacheServiceInstances: [gatewayInstance],
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
    cacheServiceInstances: [gatewayInstance],
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
  await waitForDataAndDisplayIt(gatewayInstance, 2);
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
  await waitForDataAndDisplayIt(gatewayInstance, 3);
  await waitForRelayerIterations(relayerInstance, 1);
  await verifyPricesOnChain(adapterContract, priceFeedContract, {
    BTC: valueWithGoodDeviation,
  });

  process.exit();
};

configureCleanup(stopAll);

void main();

import { RedstoneCommon } from "@redstone-finance/utils";
import {
  GatewayInstance,
  HardhatInstance,
  OracleNodeInstance,
  PriceSet,
  configureCleanup,
  debug,
  deployMockAdapterAndSetInitialPrices,
  deployMockPriceFeed,
  setMockPricesMany,
  startAndWaitForGateway,
  startAndWaitForHardHat,
  startAndWaitForOracleNode,
  startDirectAndPublicCacheServices,
  startRelayer,
  stopDirectAndPublicCacheServices,
  stopGateway,
  stopHardhat,
  stopOracleNode,
  stopRelayer,
  verifyPricesInCacheService,
  verifyPricesNotInCacheService,
  verifyPricesNotOnChain,
  verifyPricesOnChain,
  waitForDataAndDisplayIt,
} from "./framework/integration-test-framework";

const gatewayInstance1: GatewayInstance = { instanceId: "1" };
const gatewayInstance2: GatewayInstance = { instanceId: "2" };
const oracleNodeInstance1: OracleNodeInstance = { instanceId: "1" };
const oracleNodeInstance2: OracleNodeInstance = { instanceId: "2" };
const oracleNodeInstance3: OracleNodeInstance = { instanceId: "3" };
const relayerInstanceMain: OracleNodeInstance = { instanceId: "main" };
const relayerInstanceFallback: OracleNodeInstance = { instanceId: "fallback" };
const hardhatInstance: HardhatInstance = { instanceId: "1" };

const allOracleNodeInstances = [
  oracleNodeInstance1,
  oracleNodeInstance2,
  oracleNodeInstance3,
];

const stopAll = () => {
  debug("stopAll called");
  stopRelayer(relayerInstanceMain);
  stopRelayer(relayerInstanceFallback);
  stopHardhat(hardhatInstance);
  stopOracleNode(oracleNodeInstance1);
  stopOracleNode(oracleNodeInstance2);
  stopOracleNode(oracleNodeInstance3);
  stopGateway(gatewayInstance1);
  stopGateway(gatewayInstance2);
};

const main = async () => {
  const allGateways = [gatewayInstance1, gatewayInstance2];
  setMockPricesMany({ __DEFAULT__: 42 }, allOracleNodeInstances);
  let expectedPrices: PriceSet = { BTC: 42 };

  await startAndWaitForGateway(gatewayInstance1, {
    directOnly: false,
    enableHistoricalDataServing: true,
  });
  await startAndWaitForGateway(gatewayInstance2, {
    directOnly: false,
    enableHistoricalDataServing: true,
  });
  await startAndWaitForOracleNode(oracleNodeInstance1, allGateways);
  await startAndWaitForOracleNode(oracleNodeInstance2, allGateways);
  await startAndWaitForOracleNode(oracleNodeInstance3, allGateways);
  await waitForDataAndDisplayIt(gatewayInstance1);
  await waitForDataAndDisplayIt(gatewayInstance2);
  await startAndWaitForHardHat(hardhatInstance);

  const adapterContract =
    await deployMockAdapterAndSetInitialPrices(allGateways);
  const adapterContractAddress = adapterContract.address;
  const priceFeedContract = await deployMockPriceFeed(adapterContractAddress);

  startRelayer(relayerInstanceMain, {
    cacheServiceInstances: allGateways,
    adapterContractAddress,
    isFallback: false,
  });
  startRelayer(relayerInstanceFallback, {
    cacheServiceInstances: allGateways,
    adapterContractAddress,
    isFallback: true,
  });

  // verify everything works
  await verifyPricesInCacheService(allGateways, expectedPrices);
  await verifyPricesOnChain(adapterContract, priceFeedContract, expectedPrices);

  // stop single oracle node and cache service and verify everything works
  stopOracleNode(oracleNodeInstance1);
  stopDirectAndPublicCacheServices(gatewayInstance1);
  setMockPricesMany({ __DEFAULT__: 43 }, allOracleNodeInstances);
  expectedPrices = { BTC: 43 };
  await verifyPricesInCacheService(allGateways, expectedPrices);
  await verifyPricesOnChain(adapterContract, priceFeedContract, expectedPrices);

  // stop all nodes and verify that prices are not being updated
  stopOracleNode(oracleNodeInstance2);
  stopOracleNode(oracleNodeInstance3);
  setMockPricesMany({ __DEFAULT__: 44 }, allOracleNodeInstances);
  expectedPrices = { BTC: 44 };
  await verifyPricesNotInCacheService(allGateways, expectedPrices);
  await verifyPricesNotOnChain(
    adapterContract,
    priceFeedContract,
    expectedPrices
  );

  // start stopped nodes and cache service, stop another cache service one and verify if everything works
  await startAndWaitForOracleNode(oracleNodeInstance2, allGateways);
  await startAndWaitForOracleNode(oracleNodeInstance3, allGateways);
  await startDirectAndPublicCacheServices(gatewayInstance1);
  stopDirectAndPublicCacheServices(gatewayInstance2);
  setMockPricesMany({ __DEFAULT__: 45 }, allOracleNodeInstances);
  expectedPrices = { BTC: 45 };
  await verifyPricesInCacheService(allGateways, expectedPrices);
  await verifyPricesOnChain(adapterContract, priceFeedContract, expectedPrices);

  // stop main relayer and verify that prices are not updated...
  stopRelayer(relayerInstanceMain);
  setMockPricesMany({ __DEFAULT__: 46 }, allOracleNodeInstances);
  expectedPrices = { BTC: 46 };
  await verifyPricesInCacheService(allGateways, expectedPrices);
  await verifyPricesNotOnChain(
    adapterContract,
    priceFeedContract,
    expectedPrices
  );
  await RedstoneCommon.sleep(100_000); // fallback relayer delay is 120 seconds and verifyPricesNotOnChain takes 4*5 = 20 seconds

  // ... unless fallback relayer kicks in
  await verifyPricesOnChain(adapterContract, priceFeedContract, expectedPrices);

  process.exit();
};

configureCleanup(stopAll);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

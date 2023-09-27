import { abi as priceFeedAbi } from "@redstone-finance/on-chain-relayer/artifacts/contracts/mocks/PriceFeedWithRoundsMock.sol/PriceFeedWithRoundsMock.json";
import { PriceFeedWithRounds } from "@redstone-finance/on-chain-relayer/typechain-types";
import { RedstoneCommon } from "@redstone-finance/utils";
import { ethers } from "ethers";
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
  await startAndWaitForCacheLayer(cacheLayerInstance, true);
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

  const adapterContractAddress = await deployMockAdapter();
  const priceFeedContractAddress = await deployMockPriceFeed(
    adapterContractAddress
  );

  startRelayer(relayerInstance, {
    cacheServiceInstances: [cacheLayerInstance],
    adapterContractAddress,
    isFallback: false,
  });
  await verifyPricesOnChain(adapterContractAddress, priceFeedContractAddress, {
    BTC: 16000,
  });
  // end of updating first prices

  //restart relayer with condition on value deviation 10%
  stopRelayer(relayerInstance);
  startRelayer(relayerInstance, {
    cacheServiceInstances: [cacheLayerInstance],
    adapterContractAddress,
    intervalInMs: 5_000,
    updateTriggers: {
      timeSinceLastUpdateInMilliseconds: 60_000,
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
  await verifyPricesOnChain(adapterContractAddress, priceFeedContractAddress, {
    BTC: valueWithGoodDeviation,
    ETH: 42 + 42 * 0.01,
  });

  const priceFeed = new ethers.Contract(
    priceFeedContractAddress,
    priceFeedAbi,
    new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
  ) as PriceFeedWithRounds;

  const currentRoundsCount = await priceFeed.latestRound();
  if (currentRoundsCount.toNumber() !== 2) {
    throw new Error(
      `Expected round id to equals 2, but equals ${currentRoundsCount.toString()}`
    );
  }

  // here time deviation should kick in
  await RedstoneCommon.sleep(70_000);
  const nextRoundCount = await priceFeed.latestRound();
  if (nextRoundCount.toNumber() !== 3) {
    throw new Error(
      `Expected round id to equals 3, but equals ${nextRoundCount.toString()}`
    );
  }

  process.exit();
};

configureCleanup(stopAll);

void main();

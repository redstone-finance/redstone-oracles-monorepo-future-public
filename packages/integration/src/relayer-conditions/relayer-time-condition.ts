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

  // iteration of relayer happen every ~10 seconds
  // time since last update is set on every 8 seconds
  // so on every relayer iteration we should publish new timestamp
  startRelayer(relayerInstance, {
    cacheServiceInstances: [cacheLayerInstance],
    adapterContractAddress,
    intervalInMs: 10_000,
    updateTriggers: {
      timeSinceLastUpdateInMilliseconds: 8_000,
    },
    isFallback: false,
  });

  // after 33 seconds 33 / 10 = ~3 iterations should happen
  console.log("Waiting 33 seconds, for relayer");
  await RedstoneCommon.sleep(33_000);

  const priceFeed = new ethers.Contract(
    priceFeedContractAddress,
    priceFeedAbi,
    new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
  ) as PriceFeedWithRounds;

  const currentRound = await priceFeed.latestRound();
  if (currentRound.toNumber() !== 4) {
    throw new Error(
      `Expected round id to equals 4, but equals ${currentRound.toString()}`
    );
  }

  await verifyPricesOnChain(adapterContractAddress, priceFeedContractAddress, {
    BTC: 16000,
  });

  process.exit();
};

configureCleanup(stopAll);

void main();

import { Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { formatBytes32String } from "ethers/lib/utils";
import { config } from "../src/config";

export const ethDataFeed = formatBytes32String("ETH");
export const btcDataFeed = formatBytes32String("BTC");

interface DataPoint {
  dataFeedId: string;
  value: number;
}

export const dataFeedsIds = [ethDataFeed, btcDataFeed];

export const getWrappedContractAndUpdateBlockTimestamp = async (
  contract: Contract,
  timestamp: number,
  newDataPoint?: DataPoint
) => {
  const dataPoints = [
    { dataFeedId: "ETH", value: 1670.99 },
    { dataFeedId: "BTC", value: 23077.68 },
  ];
  if (newDataPoint) {
    dataPoints.push(newDataPoint);
  }
  const blockTimestamp = await time.latest();
  await time.setNextBlockTimestamp(blockTimestamp + 10);
  return WrapperBuilder.wrap(contract).usingSimpleNumericMock({
    mockSignersCount: 10,
    dataPoints,
    timestampMilliseconds: timestamp,
  });
};

export const mockEnvVariables = () => {
  (config as any) = {
    relayerIterationInterval: "10000",
    updatePriceInterval: "110000",
    rpcUrl: "http://127.0.0.1:8545",
    chainName: "HardhatNetwork",
    chainId: "31337",
    privateKey: "",
    managerContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    dataServiceId: "redstone-main-demo",
    uniqueSignersCount: "2",
    dataFeeds: ["ETH", "BTC"],
    cacheServiceUrls: ["http://mock-cache-service"],
    gasLimit: 1000000,
    updateCondition: "time",
  };
};

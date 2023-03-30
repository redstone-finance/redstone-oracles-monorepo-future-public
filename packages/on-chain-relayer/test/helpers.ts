import { Contract } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { NumericDataPoint, DataPackage } from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";
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

export const mockEnvVariables = (overrideMockConfig: any = {}) => {
  (config as any) = {
    relayerIterationInterval: "10",
    updatePriceInterval: "1000",
    rpcUrl: "http://127.0.0.1:8545",
    chainName: "HardhatNetwork",
    chainId: "31337",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // well-known private key for the first hardhat account
    adapterContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    dataServiceId: "redstone-main-demo",
    uniqueSignersCount: "2",
    dataFeeds: ["ETH", "BTC"],
    cacheServiceUrls: ["http://mock-cache-service"],
    gasLimit: 1000000,
    updateConditions: ["time", "value-deviation"],
    minDeviationPercentage: 10,
    adapterContractType: "price-feeds",
    ...overrideMockConfig,
  };
};

type DataPointsKeys = "ETH" | "BTC";

const mockWallets = [
  {
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
  {
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
];

export const getDataPackagesResponse = () => {
  const timestampMilliseconds = Date.now();

  const dataPoints = [
    { dataFeedId: "ETH", value: 1670.99 },
    { dataFeedId: "BTC", value: 23077.68 },
  ];

  const signedDataPackages: DataPackagesResponse = {
    ETH: [],
    BTC: [],
  };

  for (const mockWallet of mockWallets) {
    for (const dataPointObj of dataPoints) {
      const dataPoint = new NumericDataPoint(dataPointObj);
      const mockDataPackage = {
        signer: mockWallet.address,
        dataPackage: new DataPackage([dataPoint], timestampMilliseconds),
      };
      const privateKey = mockWallet.privateKey;
      const signedDataPackage = mockDataPackage.dataPackage.sign(privateKey);
      signedDataPackages[dataPointObj.dataFeedId as DataPointsKeys].push(
        signedDataPackage
      );
    }
  }
  return signedDataPackages;
};

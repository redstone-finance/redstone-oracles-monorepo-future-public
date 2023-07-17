import { BigNumber, Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import {
  DataPackage,
  INumericDataPoint,
  NumericDataPoint,
} from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";
import { formatBytes32String } from "ethers/lib/utils";
import { setConfigProvider } from "../src";
import { ethers } from "hardhat";

export const ethDataFeed = formatBytes32String("ETH");
export const btcDataFeed = formatBytes32String("BTC");

interface DataPoint {
  dataFeedId: string;
  value: number;
}

export const createNumberFromContract = (number: number, decimals = 8) =>
  BigNumber.from(number * 10 ** decimals);

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
    mockSignersCount: 2,
    dataPoints,
    timestampMilliseconds: timestamp,
  });
};

export const mockEnvVariables = (overrideMockConfig: any = {}) => {
  setConfigProvider(() => {
    return {
      relayerIterationInterval: "10",
      updatePriceInterval: 1000,
      rpcUrl: "http://127.0.0.1:8545",
      chainName: "HardhatNetwork",
      chainId: "31337",
      privateKey:
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // well-known private key for the first hardhat account
      adapterContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      dataServiceId: "redstone-main-demo",
      dataFeeds: ["ETH", "BTC"],
      gasLimit: 1000000,
      updateConditions: ["time", "value-deviation"],
      minDeviationPercentage: 10,
      adapterContractType: "price-feeds",
      ...overrideMockConfig,
    };
  });
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

const DEFAULT_DATA_POINTS = [
  { dataFeedId: "ETH", value: 1670.99 },
  { dataFeedId: "BTC", value: 23077.68 },
];

export const getDataPackagesResponse = async (
  dataPoints: INumericDataPoint[] = DEFAULT_DATA_POINTS
) => {
  const timestampMilliseconds = (await time.latest()) * 1000;

  const signedDataPackages: DataPackagesResponse = {};

  for (const mockWallet of mockWallets) {
    for (const dataPointObj of dataPoints) {
      const dataPoint = new NumericDataPoint(dataPointObj);
      const mockDataPackage = {
        signer: mockWallet.address,
        dataPackage: new DataPackage([dataPoint], timestampMilliseconds),
      };
      const privateKey = mockWallet.privateKey;
      const signedDataPackage = mockDataPackage.dataPackage.sign(privateKey);
      if (!signedDataPackages[dataPointObj.dataFeedId as DataPointsKeys]) {
        signedDataPackages[dataPointObj.dataFeedId as DataPointsKeys] = [];
      }
      signedDataPackages[dataPointObj.dataFeedId as DataPointsKeys].push(
        signedDataPackage
      );
    }
  }
  return signedDataPackages;
};

export const deployMockSortedOracles = async (signer?: Signer) => {
  // Deploying AddressSortedLinkedListWithMedian library
  const AddressSortedLinkedListWithMedianFactory =
    await ethers.getContractFactory(
      "AddressSortedLinkedListWithMedian",
      signer
    );
  const sortedLinkedListContract =
    await AddressSortedLinkedListWithMedianFactory.deploy();
  await sortedLinkedListContract.deployed();

  // Deploying MockSortedOracles contract
  const MockSortedOraclesFactory = await ethers.getContractFactory(
    "MockSortedOracles",
    {
      libraries: {
        AddressSortedLinkedListWithMedian: sortedLinkedListContract.address,
      },
      signer,
    }
  );
  const contract = await MockSortedOraclesFactory.deploy();
  await contract.deployed();
  return contract;
};

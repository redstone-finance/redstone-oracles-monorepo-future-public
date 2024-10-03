import { RedstoneOraclesState } from "@redstone-finance/oracles-smartweave-contracts";
import {
  DataPackage,
  DataPoint,
  NumericDataPoint,
  consts,
  utils,
} from "@redstone-finance/protocol";
import { ethers } from "ethers";

export const MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export const mockSigner = new ethers.Wallet(MOCK_PRIVATE_KEY);
export const MOCK_DATA_SERVICE_ID = "mock-data-service-1";

export const MOCK_SIGNER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // is equal to mockSigner.address

export const mockOracleRegistryState: RedstoneOraclesState = {
  dataServices: {
    "mock-data-service-1": {
      name: "Mock data service 1",
      manifestTxId: "mock-manifest-tx-id",
      logo: "mock-logo-url",
      description: "mock-description",
      admin: "mock-admin",
    },
    "mock-data-service-2": {
      name: "Mock data service 1",
      manifestTxId: "mock-manifest-tx-id",
      logo: "mock-logo-url",
      description: "mock-description",
      admin: "mock-admin",
    },
  },
  nodes: {
    "mock-node-1": {
      name: "Mock node 1",
      logo: "mock-logo-url",
      description: "mock-description",
      dataServiceId: MOCK_DATA_SERVICE_ID,
      evmAddress: mockSigner.address,
      ipAddress: "0.0.0.0",
      ecdsaPublicKey: "mock-ecdsa-key",
    },
  },
  contractAdmins: [],
  canEvolve: true,
  evolve: null,
};

export const MOCK_SIGNATURE =
  "PJkkAPFdAh24XW5IyiFbdL2Sjhsl7S7kLSGoiCACZZtGNjkeHXiFed7Zq4KP1pMVAanBp5B+qmtKb9Wht5RANxw=";

export const produceMockDataPackage = (
  dataPoints: DataPoint[],
  dataPackageName: string,
  timestamp = 1654353400000,
  privateKey = MOCK_PRIVATE_KEY
) => {
  const dataPackage = new DataPackage(
    dataPoints,
    timestamp,
    dataPackageName
  ).sign(privateKey);

  return dataPackage.toObj();
};

export const getMockDataPackages = () => [
  produceMockDataPackage(
    [
      new NumericDataPoint({ dataFeedId: "mock-data-feed-id-1", value: 42 }),
      new NumericDataPoint({ dataFeedId: "mock-data-feed-id-2", value: 123 }),
      new DataPoint("XD", utils.convertNumberToBytes(1.2, 8, 32), {
        type: "HEX_BIG_INT",
        sources: { exchange_1: "1.19", exchange_2: "1.20", exchange_3: "1.21" },
      }),
    ],
    "___ALL_FEEDS___"
  ),
];

export const mockDataPackagesForUniqueSigners = [
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: "BTC",
    dataPackageId: "BTC",
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x2",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: "BTC",
    dataPackageId: "BTC",
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x3",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: "BTC",
    dataPackageId: "BTC",
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x3",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: "BTC",
    dataPackageId: "BTC",
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x3",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: "ETH",
    dataPackageId: "BTC",
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x2",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: "ETH",
    dataPackageId: "ETH",
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x2",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: "ETH",
    dataPackageId: "ETH",
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x5",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: consts.ALL_FEEDS_KEY,
    dataPackageId: consts.ALL_FEEDS_KEY,
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x4",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: consts.ALL_FEEDS_KEY,
    dataPackageId: consts.ALL_FEEDS_KEY,
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x4",
  },
  {
    ...getMockDataPackages()[0],
    isSignatureValid: true,
    dataFeedId: consts.ALL_FEEDS_KEY,
    dataPackageId: consts.ALL_FEEDS_KEY,
    dataServiceId: "mock-data-service-1",
    signerAddress: "0x5",
  },
];

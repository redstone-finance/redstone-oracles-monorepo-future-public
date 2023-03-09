import { setupServer } from "msw/node";
import { rest } from "msw";
import {
  NumericDataPoint,
  DataPackage,
  SignedDataPackagePlainObj,
} from "redstone-protocol";

type DataPointsKeys = "ETH" | "BTC";

interface SignedDataPackages {
  ETH: SignedDataPackagePlainObj[];
  BTC: SignedDataPackagePlainObj[];
}

const handlers = [
  rest.get(
    "http://mock-cache-service/data-packages/latest/redstone-main-demo",
    async (req, res, ctx) => {
      return res(ctx.json(getSignedDataPackages()));
    }
  ),
];

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

const getSignedDataPackages = () => {
  const timestampMilliseconds = Date.now();

  const dataPoints = [
    { dataFeedId: "ETH", value: 1670.99 },
    { dataFeedId: "BTC", value: 23077.68 },
  ];

  const signedDataPackages: SignedDataPackages = {
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
        signedDataPackage.toObj()
      );
    }
  }
  return signedDataPackages;
};

export const server = setupServer(...handlers);

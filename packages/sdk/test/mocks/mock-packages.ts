import type { SignedDataPackagePlainObj } from "@redstone-finance/protocol";

const signedDataPackagesObjects: (SignedDataPackagePlainObj & {
  dataServiceId: string;
  signerAddress: string;
})[] = [
  {
    dataPoints: [
      { dataFeedId: "ETH", value: 1000 },
      { dataFeedId: "BTC", value: 20000 },
    ],
    timestampMilliseconds: 1654353400000,
    signature:
      "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
    dataServiceId: "service-1",
    dataPackageId: "ETH",
    signerAddress: "0x1",
  },
  {
    dataPoints: [
      { dataFeedId: "ETH", value: 1000 },
      { dataFeedId: "BTC", value: 20000 },
    ],
    timestampMilliseconds: 1654353400000,
    signature:
      "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
    dataServiceId: "service-1",
    dataPackageId: "ETH",
    signerAddress: "0x2",
  },
  {
    dataPoints: [
      { dataFeedId: "ETH", value: 990 },
      { dataFeedId: "BTC", value: 20000 },
    ],
    timestampMilliseconds: 1654353400000,
    signature:
      "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
    dataServiceId: "service-1",
    dataPackageId: "ETH",
    signerAddress: "0x2",
  },
  {
    dataPoints: [
      { dataFeedId: "ETH", value: 1002 },
      { dataFeedId: "BTC", value: 20000 },
    ],
    timestampMilliseconds: 1654353400000,
    signature:
      "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
    dataServiceId: "service-1",
    dataPackageId: "ETH",
    signerAddress: "0x2",
  },
];

export const mockSignedDataPackages = {
  ETH: signedDataPackagesObjects,
  BTC: signedDataPackagesObjects,
};

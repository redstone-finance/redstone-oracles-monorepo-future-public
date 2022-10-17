const signedDataPackagesObjects = [
  {
    dataPoints: [
      { dataFeedId: "BTC", value: 20000 },
      { dataFeedId: "ETH", value: 1000 },
    ],
    timestampMilliseconds: 1654353400000,
    signature:
      "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
    dataServiceId: "service-1",
    dataFeedId: "ETH",
    sources: null,
    signerAddress: "0x1",
  },
  {
    dataPoints: [
      { dataFeedId: "BTC", value: 20000 },
      { dataFeedId: "ETH", value: 1000 },
    ],
    timestampMilliseconds: 1654353400000,
    signature:
      "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
    dataServiceId: "service-1",
    dataFeedId: "ETH",
    sources: null,
    signerAddress: "0x2",
  },
];

export const mockSignedDataPackages = {
  ETH: signedDataPackagesObjects,
  BTC: signedDataPackagesObjects,
};

import {
  getMockNumericPackage,
  getMockStringPackage,
  getRange,
  MockNumericPackageArgs,
  MockSignerIndex,
  MockStringPackageArgs,
} from "../src/helpers/test-utils";

export const NUMBER_OF_MOCK_NUMERIC_SIGNERS = 10;

export const mockNumericPackageConfigs: MockNumericPackageArgs[] = [
  {
    mockSignerIndex: 0,
    dataPoints: [
      { dataFeedId: "BTC", value: 412 },
      { dataFeedId: "ETH", value: 41 },
      { dataFeedId: "SOME OTHER ID 0", value: 123 },
      { dataFeedId: "SOME OTHER ID 1", value: 123 },
    ],
  },
  {
    mockSignerIndex: 1,
    dataPoints: [
      { dataFeedId: "BTC", value: 390 },
      { dataFeedId: "ETH", value: 42 },
      { dataFeedId: "SOME OTHER ID 1", value: 123 },
    ],
  },
  {
    mockSignerIndex: 2,
    dataPoints: [
      { dataFeedId: "BTC", value: 400 },
      { dataFeedId: "ETH", value: 43 },
      { dataFeedId: "SOME OTHER ID 2", value: 123 },
    ],
  },
  ...getRange({ start: 3, length: NUMBER_OF_MOCK_NUMERIC_SIGNERS - 3 }).map(
    (mockSignerIndex: any) => ({
      mockSignerIndex,
      dataPoints: [
        { dataFeedId: "ETH", value: 42 },
        { dataFeedId: "BTC", value: 400 },
        { dataFeedId: "SOME OTHER ID", value: 123 },
      ],
    })
  ),
];

export const mockNumericPackages = mockNumericPackageConfigs.map(
  getMockNumericPackage
);

export const expectedNumericValues: any = {
  ETH: 42 * 10 ** 8,
  BTC: 400 * 10 ** 8,
};

export const bytesDataPoints = [
  {
    dataFeedId: "ETH",
    value: "Ethereum",
  },
  {
    dataFeedId: "BTC",
    value: "Bitcoin_",
  },
  {
    dataFeedId: "SOME OTHER ID",
    value: "Hahahaha",
  },
];

export const mockBytesPackageConfigs: MockStringPackageArgs[] = getRange({
  start: 0,
  length: 3,
}).map((i) => ({
  dataPoints: bytesDataPoints,
  mockSignerIndex: i as MockSignerIndex,
}));

export const mockBytesPackages =
  mockBytesPackageConfigs.map(getMockStringPackage);

export const expectedBytesValues = {
  ETH: "0x457468657265756d",
  BTC: "0x426974636f696e5f",
};

export const UNAUTHORISED_SIGNER_INDEX = 19;

import {
  getMockNumericPackage,
  getRange,
  MockNumericPackageArgs,
} from "../src/helpers/test-utils";

export const NUMBER_OF_MOCK_SIGNERS = 10;

export const mockPackageConfigs: MockNumericPackageArgs[] = [
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
  ...getRange({ start: 3, length: NUMBER_OF_MOCK_SIGNERS - 3 }).map(
    (mockSignerIndex: any) => ({
      mockSignerIndex,
      dataPoints: [
        { dataFeedId: "BTC", value: 400 },
        { dataFeedId: "ETH", value: 42 },
        { dataFeedId: "SOME OTHER ID", value: 123 },
      ],
    })
  ),
];

export const mockPackages = mockPackageConfigs.map((packageConfig) =>
  getMockNumericPackage(packageConfig)
);

export const expectedValues: any = {
  ETH: 42 * 10 ** 8,
  BTC: 400 * 10 ** 8,
};

import {
  DataPackage,
  SignedDataPackage,
  NumericDataPoint,
  serializeSignedDataPackages,
} from "../src";

const TIMESTAMP_FOR_TESTS = 1654353400000;
const PRIVATE_KEY_FOR_TESTS_1 =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const PRIVATE_KEY_FOR_TESTS_2 =
  "0x2222222222222222222222222222222222222222222222222222222222222222";
const EXPECTED_SERIALIZED_DATA_PACKAGE =
  "45544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e90edd0004254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003d1e382100001812f2590c000000020000002";
const EXPECTED_SIGNATURES = [
  "059756659fc7267d152ec9da24fb84b899eb1d5a39371fa8c94b39ce6e55294646468e312698948101d5637b77049f5c2e974a986f2878f021a5c057a3ce739d1c",
  "0366a9f59f53531247a2e52df9c8f0ac03b851f53a6f5fe72a0f757b5e72e4a34b394d0d2f5a96b8a88343ceaabafb763c6f96d41262817f23cac099adbbe38c1b",
];

describe("Fixed size data package", () => {
  let dataPackage: DataPackage;
  let signedDataPackages: SignedDataPackage[];

  beforeEach(() => {
    // Prepare data points
    const dataPoints = [
      { symbol: "ETH", value: 2000 },
      { symbol: "BTC", value: 42000 },
    ].map(({ symbol, value }) => new NumericDataPoint({ symbol, value }));

    // Prepare unsigned data package
    dataPackage = new DataPackage(dataPoints, TIMESTAMP_FOR_TESTS);

    // Prepare signed data packages
    signedDataPackages = [
      dataPackage.sign(PRIVATE_KEY_FOR_TESTS_1),
      dataPackage.sign(PRIVATE_KEY_FOR_TESTS_2),
    ];
  });

  test("Should correctly serialize many signed data packages", () => {
    const serializedHex = serializeSignedDataPackages(signedDataPackages);
    expect(serializedHex).toBe(
      EXPECTED_SERIALIZED_DATA_PACKAGE +
        EXPECTED_SIGNATURES[0] +
        EXPECTED_SERIALIZED_DATA_PACKAGE +
        EXPECTED_SIGNATURES[1] +
        "0002" // data packages count
    );
  });
});

import { hexlify } from "ethers/lib/utils";
import { DynamicDataPackage } from "../src/data-package/DynamicDataPackage";
import { StringDataPoint } from "../src/data-point/StringDataPoint";

const TIMESTAMP_FOR_TESTS = 1654353400000;
const PRIVATE_KEY_FOR_TESTS =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE =
  "0x" +
  "4554480000000000000000000000000000000000000000000000000000000000" + // bytes32("ETH")
  "457468657265756d" + // toUtf8Bytes("Ethereum")
  "00000008" + // bytes size of the string "Ethereum" (8)
  "4254430000000000000000000000000000000000000000000000000000000000" + // bytes32("BTC")
  "426974636f696e" + // toUtf8Bytes("Bitcoin")
  "00000007" + // bytes size of the string "Bitcoin" (7)
  "01812f2590c0" + // timestamp
  "00000000" + // default data points byte size (0 - indicates that each data point is dynamic)
  "000002"; // data points count
const EXPECTED_SIGNATURE =
  "2c42f521429a43de0e2f30cdb45e9214c1be75f08f9a9c638cf7d0f237e102c71452e54e68e973e695a10db34f1447857b416c4bcf0bf4c7a3d62cd1bb7fa6941c";

describe("Fixed size data package", () => {
  let dataPackage: DynamicDataPackage;

  beforeEach(() => {
    const dataPoints = [
      { symbol: "ETH", value: "Ethereum" },
      { symbol: "BTC", value: "Bitcoin" },
    ].map(({ symbol, value }) => new StringDataPoint(symbol, value));
    dataPackage = new DynamicDataPackage(dataPoints, TIMESTAMP_FOR_TESTS);
  });

  test("Should serialize data package", () => {
    expect(dataPackage.serializeToBytesHex()).toBe(
      EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE
    );
  });

  test("Should sign data package", () => {
    const signedDataPackage = dataPackage.sign(PRIVATE_KEY_FOR_TESTS);
    expect(hexlify(signedDataPackage.serializeSignature())).toBe(
      "0x" + EXPECTED_SIGNATURE
    );
    expect(signedDataPackage.serializeToBytesHex()).toBe(
      EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE + EXPECTED_SIGNATURE
    );
  });
});

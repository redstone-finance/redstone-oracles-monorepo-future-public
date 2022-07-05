import { Wallet } from "ethers";
import { computePublicKey, hexlify } from "ethers/lib/utils";
import { DataPackage } from "../src/data-package/DataPackage";
import { SignedDataPackage } from "../src/data-package/SignedDataPackage";
import { NumericDataPoint } from "../src/data-point/NumericDataPoint";

const TIMESTAMP_FOR_TESTS = 1654353400000;
const PRIVATE_KEY_FOR_TESTS =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE =
  "0x" +
  "4554480000000000000000000000000000000000000000000000000000000000" + // bytes32("ETH")
  "0000000000000000000000000000000000000000000000000000002e90edd000" + // 2000 * 10^8
  "4254430000000000000000000000000000000000000000000000000000000000" + // bytes32("BTC")
  "000000000000000000000000000000000000000000000000000003d1e3821000" + // 42000 * 10^8
  "01812f2590c0" + // timestamp
  "00000020" + // default data points byte size (32 in hex)
  "000002"; // data points count
const EXPECTED_SIGNATURE =
  "059756659fc7267d152ec9da24fb84b899eb1d5a39371fa8c94b39ce6e55294646468e312698948101d5637b77049f5c2e974a986f2878f021a5c057a3ce739d1c";

describe("Data package", () => {
  let dataPackage: DataPackage;

  beforeEach(() => {
    const dataPoints = [
      { symbol: "ETH", value: 2000 },
      { symbol: "BTC", value: 42000 },
    ].map((dpArgs) => new NumericDataPoint(dpArgs));
    dataPackage = new DataPackage(dataPoints, TIMESTAMP_FOR_TESTS);
  });

  test("Should serialize data package", () => {
    expect(dataPackage.serializeToBytesHex()).toBe(
      EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE
    );
  });

  test("Should sign data package", () => {
    const signedDataPackage = dataPackage.sign(PRIVATE_KEY_FOR_TESTS);
    expect(signedDataPackage.serializeSignatureToHex()).toBe(
      "0x" + EXPECTED_SIGNATURE
    );
    expect(signedDataPackage.serializeToBytesHex()).toBe(
      EXPECTED_SERIALIZED_UNSIGNED_DATA_PACKAGE + EXPECTED_SIGNATURE
    );
  });

  test("Should verify data package signature", () => {
    const signedDataPackage = new SignedDataPackage(
      dataPackage,
      "0x" + EXPECTED_SIGNATURE
    );

    // Check public key
    const expectedPublicKey = computePublicKey(PRIVATE_KEY_FOR_TESTS);
    const recoveredPublicKey = signedDataPackage.recoverSignerPublicKey();
    expect(hexlify(recoveredPublicKey)).toBe(expectedPublicKey);

    // Check address
    const expectedAddress = new Wallet(PRIVATE_KEY_FOR_TESTS).address;
    const recoveredAddress = signedDataPackage.recoverSignerAddress();
    expect(recoveredAddress).toBe(expectedAddress);
  });
});

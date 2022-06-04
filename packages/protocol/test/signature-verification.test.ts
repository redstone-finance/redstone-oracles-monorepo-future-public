import { signDataPackage } from "../src/index";
import goodSampleDataPackageBTC from "../test/sample-data-packages/valid/redstone-rapid-btc.json";
import badSampleDataPackageBTC from "../test/sample-data-packages/invalid/redstone-rapid-btc-invalid-data.json";

const TEST_PRIVATE_KEY =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

describe("Data package signing", () => {
  test("Should generate a valid signature", async () => {
    const signedPackage = await signDataPackage(
      goodSampleDataPackageBTC,
      TEST_PRIVATE_KEY
    );
    expect(signedPackage.signature).toBe(goodSampleDataPackageBTC.signature);
  });

  test("Should not generate invalid signature", async () => {
    const signedPackage = await signDataPackage(
      badSampleDataPackageBTC,
      TEST_PRIVATE_KEY
    );
    expect(signedPackage.signature).not.toBe(
      goodSampleDataPackageBTC.signature
    );
  });
});

import { ethers } from "ethers";
import { UniversalSigner } from "../src";

const PRIVATE_KEY_FOR_TESTS =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

describe("UniversalSigner", () => {
  const stringifiableData = [
    { hehe: 123, haha: 234 },
    { hehe: 123, haha: 234 },
    { hehe: 42, haha: 234 },
    { hehe: 123, haha: 42, hoho: 3498363.344 },
  ];

  test("Should correctly calculate digest for data", () => {
    const digest = UniversalSigner.getDigestForData(stringifiableData);
    expect(digest).toBe(
      "0x230a650f45bd2fb93390f0e372a77022536e6d9da6408aa3f1b2f28e04fb2011"
    );
  });

  test("Should properly sign and verify stringifiable data", () => {
    const signature = UniversalSigner.signStringifiableData(
      stringifiableData,
      PRIVATE_KEY_FOR_TESTS
    );
    const recoveredSigner = UniversalSigner.recoverSigner(
      stringifiableData,
      signature
    );
    expect(recoveredSigner).toBe(
      new ethers.Wallet(PRIVATE_KEY_FOR_TESTS).address
    );
  });

  test("Should not verify incorrectly signed data", () => {
    const signature = UniversalSigner.signStringifiableData(
      stringifiableData,
      PRIVATE_KEY_FOR_TESTS
    );
    const recoveredSigner = UniversalSigner.recoverSigner(
      [...stringifiableData, { hoho: 100 }],
      signature
    );
    expect(recoveredSigner).not.toBe(
      new ethers.Wallet(PRIVATE_KEY_FOR_TESTS).address
    );
  });
});

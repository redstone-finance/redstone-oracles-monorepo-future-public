import { splitSignature } from "@ethersproject/bytes";
import { ethers } from "ethers";
import { UniversalSigner } from "../src";

const PRIVATE_KEY_FOR_TESTS =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const ECDSA_N = BigInt(
  "0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"
);
const TEST_MESSAGE_SIGNATURE =
  "0x13a3b3930428252cd84869dda483619bf2167011afbf3a32d0dc69b559848f0c007c55e25cb7a3f0a17f59986b106dca0ebf44f14dcb55f94fe035c40dabba731b";

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

  test("Should sign with Ethereum Hash Message", async () => {
    const wallet = new ethers.Wallet(PRIVATE_KEY_FOR_TESTS);
    const testMessage = "test-message";
    const signature = await UniversalSigner.signWithEthereumHashMessage(
      wallet,
      testMessage
    );
    expect(signature).toBe(TEST_MESSAGE_SIGNATURE);
  });

  test("Should verify Ethereum Hash Message", () => {
    const testMessage = "test-message";
    const recoveredAddress =
      UniversalSigner.recoverAddressFromEthereumHashMessage(
        testMessage,
        TEST_MESSAGE_SIGNATURE
      );
    expect(recoveredAddress).toBe(
      new ethers.Wallet(PRIVATE_KEY_FOR_TESTS).address
    );
  });

  test("Should properly verify base signatures", () => {
    [
      TEST_MESSAGE_SIGNATURE,
      replaceSignatureSV(TEST_MESSAGE_SIGNATURE, ECDSA_N / 2n),
      replaceSignatureSV(TEST_MESSAGE_SIGNATURE, ECDSA_N / 2n - 1n),
      replaceSignatureSV(TEST_MESSAGE_SIGNATURE, 0n),
      splitSignature(TEST_MESSAGE_SIGNATURE),
    ].forEach((sig) => {
      expect(UniversalSigner.verifyAndSplitSignature(sig)).toEqual(
        expect.objectContaining({
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          r: expect.any(String),
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          s: expect.any(String),
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          v: expect.any(Number),
        })
      );
    });
  });

  test("Should throw on wrong signature when wrong v is passed", () => {
    const signature = TEST_MESSAGE_SIGNATURE.substring(0, 130) + "01";

    expect(() => UniversalSigner.verifyAndSplitSignature(signature)).toThrow(
      "Invalid signature 'v' value - must be 27 or 28 but is: 1"
    );
  });

  test("Should throw on wrong signature when wrong s is passed", () => {
    const signature = fixSignatureForMalleability(TEST_MESSAGE_SIGNATURE);

    expect(() => UniversalSigner.verifyAndSplitSignature(signature)).toThrow(
      "Invalid signature 's' value"
    );
  });

  test("Should throw on wrong signature when too big s is passed", () => {
    expect(() =>
      UniversalSigner.verifyAndSplitSignature(
        replaceSignatureSV(TEST_MESSAGE_SIGNATURE, ECDSA_N / 2n + 1n)
      )
    ).toThrow("Invalid signature 's' value");
  });

  test("Should fail on Signature Malleability attack", () => {
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

    expect(() =>
      UniversalSigner.recoverSigner(
        stringifiableData,
        fixSignatureForMalleability(signature)
      )
    ).toThrow("Invalid signature 's' value");
  });

  function fixSignatureForMalleability(baseSignature: string) {
    const signature = baseSignature.startsWith("0x")
      ? baseSignature.substring(2)
      : baseSignature;

    const S = signature.substring(64, 128);
    const newV = signature.substring(128) == "1b" ? "1c" : "1b";
    const newS = ECDSA_N - BigInt("0x" + S);

    return replaceSignatureSV(baseSignature, newS, newV);
  }

  function replaceSignatureSV(
    baseSignature: string,
    newS: bigint,
    newV?: string
  ) {
    const signature = baseSignature.startsWith("0x")
      ? baseSignature.substring(2)
      : baseSignature;

    return (
      (baseSignature.startsWith("0x") ? "0x" : "") +
      signature.substring(0, 64) +
      newS.toString(16).padStart(64, "0") +
      (newV ?? signature.substring(128))
    );
  }
});

import { hexlify } from "ethers/lib/utils";
import {
  assert,
  convertIntegerNumberToBytes,
  convertNumberToBytes,
  convertStringToBytes32,
} from "../src/common/utils";

describe("Utils", () => {
  test("Should assert correctly", () => {
    assert(true);
    assert(true, "Some message");
    expect(() => assert(false)).toThrowError("Assertion failed");
    expect(() => assert(false, "Custom msg")).toThrowError(
      "Assertion failed: Custom msg"
    );
  });

  test("Should correctly convert strings to bytes32", () => {
    expect(hexlify(convertStringToBytes32("ETH"))).toBe(
      "0x4554480000000000000000000000000000000000000000000000000000000000"
    );
    expect(hexlify(convertStringToBytes32("BTC"))).toBe(
      "0x4254430000000000000000000000000000000000000000000000000000000000"
    );
    expect(hexlify(convertStringToBytes32("Still short string"))).toBe(
      "0x5374696c6c2073686f727420737472696e670000000000000000000000000000"
    );
    expect(hexlify(convertStringToBytes32(""))).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(
      hexlify(convertStringToBytes32("Long string - longer than 32 characters"))
    ).toBe(
      "0x521e07e3034088704b35350d34ac32d1512f3d119f60761ba2597337f2124e51"
    );
    expect(
      hexlify(
        convertStringToBytes32("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")
      )
    ).toBe(
      "0xf4ca8532861558e29f9858a3804245bb30f0303cc71e4192e41546237b6ce58b"
    );
  });

  test("Should correctly convert integer numbers to bytes", () => {
    expect(hexlify(convertIntegerNumberToBytes(255, 2))).toBe("0x00ff");
    expect(hexlify(convertIntegerNumberToBytes(15, 2))).toBe("0x000f");
    expect(hexlify(convertIntegerNumberToBytes(9, 3))).toBe("0x000009");
    expect(hexlify(convertIntegerNumberToBytes(65535, 2))).toBe("0xffff");
    expect(() => convertIntegerNumberToBytes(65536, 2)).toThrowError(
      "Overflow: value: 65536, decimals: 0, byteSize: 2"
    );
  });

  test("Should correctly convert integer number strings to bytes", () => {
    expect(hexlify(convertIntegerNumberToBytes("9", 3))).toBe("0x000009");
    expect(hexlify(convertIntegerNumberToBytes("65535", 2))).toBe("0xffff");
    expect(() => convertIntegerNumberToBytes("65536", 2)).toThrowError(
      "Overflow: value: 65536, decimals: 0, byteSize: 2"
    );
  });

  test("Should correctly convert float numbers to bytes", () => {
    expect(hexlify(convertIntegerNumberToBytes(910, 4))).toBe("0x0000038e");
    expect(hexlify(convertIntegerNumberToBytes("910", 4))).toBe("0x0000038e");
    expect(hexlify(convertNumberToBytes(9.1, 2, 4))).toBe("0x0000038e");

    expect(hexlify(convertIntegerNumberToBytes(421234567000, 32))).toBe(
      "0x0000000000000000000000000000000000000000000000000000006213896758"
    );
    expect(hexlify(convertNumberToBytes(42.1234567, 10, 32))).toBe(
      "0x0000000000000000000000000000000000000000000000000000006213896758"
    );

    expect(() => convertNumberToBytes(42.1234567, 10, 4)).toThrow(
      "Overflow: value: 42.1234567, decimals: 10, byteSize: 4"
    );
  });

  test("Should works for big numbers (>1e21)", () => {
    expect(hexlify(convertIntegerNumberToBytes(1e21, 20))).toBe(
      "0x00000000000000000000003635c9adc5dea00000"
    );

    expect(hexlify(convertNumberToBytes(1e50, 2, 50))).toBe(
      "0x000000000000000000000000000000000000000000000000000000001aba4714957d300d0e549208b31adb10000000000000"
    );
  });

  test("Should throw on NaN", () => {
    expect(() => convertIntegerNumberToBytes(NaN, 20)).toThrow(
      "Assertion failed: convertIntegerNumberToBytes expects integer as input"
    );

    expect(() => convertNumberToBytes(NaN, 2, 20)).toThrow(
      /invalid decimal value/
    );
  });

  test("Should throw on Infinity", () => {
    expect(() => convertIntegerNumberToBytes(Infinity, 20)).toThrow(
      "Assertion failed: convertIntegerNumberToBytes expects integer as input"
    );

    expect(() => convertNumberToBytes(-Infinity, 2, 20)).toThrow(
      /invalid decimal value/
    );
  });

  test("Should fail on float passed to convertIntegerNumberToBytes", () => {
    expect(() => convertIntegerNumberToBytes(12.12, 4)).toThrow(
      "Assertion failed: convertIntegerNumberToBytes expects integer as input"
    );

    expect(() => convertIntegerNumberToBytes("12.12", 4)).toThrow(
      "Assertion failed: convertIntegerNumberToBytes expects integer as input"
    );
  });
});

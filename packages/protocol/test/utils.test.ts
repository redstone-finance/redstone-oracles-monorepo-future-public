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

  test("Should round fractional component if it exceeds decimal", () => {
    expect(() => convertNumberToBytes(42.123456789, 8, 32, false)).toThrow(
      "fractional component exceeds decimals"
    );

    expect(hexlify(convertNumberToBytes(42.123456789, 8, 32))).toBe(
      "0x00000000000000000000000000000000000000000000000000000000fb134b4f"
    );
  });
});

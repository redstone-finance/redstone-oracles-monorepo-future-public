import {
  arrayify,
  BytesLike,
  formatBytes32String,
  hexlify,
  keccak256,
  parseUnits,
  toUtf8Bytes,
  zeroPad,
} from "ethers/lib/utils";

const ZERO_EX_PREFIX_LENGTH = 2; // length of string "0x"

export type NumberLike = number | string;

export type ConvertableToBytes32 = string;

export const assert = (condition: boolean, errMsg?: string) => {
  if (!condition) {
    const errText = `Assertion failed` + (errMsg ? `: ${errMsg}` : "");
    throw new Error(errText);
  }
};

export const convertStringToBytes32 = (str: string): Uint8Array => {
  const bytes32Str: string =
    str.length > 31 ? keccak256(toUtf8Bytes(str)) : formatBytes32String(str);
  return arrayify(bytes32Str);
};

export const convertNumberToBytes = (
  value: NumberLike,
  decimals: number,
  byteSize: number,
  roundFractionalComponentIfExceedsDecimals: boolean = true
): Uint8Array => {
  const stringifiedNumber = roundFractionalComponentIfExceedsDecimals
    ? Number(value).toFixed(decimals)
    : String(value);
  const bigNumberValue = parseUnits(stringifiedNumber, decimals);
  const bytesValue = arrayify(bigNumberValue.toHexString());

  if (byteSize < bytesValue.length) {
    throw new Error(
      `Overflow: ` +
        `value: ${value}, ` +
        `decimals: ${decimals}, ` +
        `byteSize: ${byteSize}`
    );
  } else {
    return zeroPad(bytesValue, byteSize);
  }
};

export const convertIntegerNumberToBytes = (
  value: NumberLike,
  byteSize: number
): Uint8Array => {
  const decimals = 0; // 0 digits after comma
  return convertNumberToBytes(value, decimals, byteSize);
};

export const hexlifyWithout0xPrefix = (value: BytesLike): string => {
  return hexlify(value).slice(ZERO_EX_PREFIX_LENGTH);
};

export function useDefaultIfUndefined<T>(
  value: T | undefined,
  defaultValue: T
): T {
  return value === undefined ? defaultValue : value;
}

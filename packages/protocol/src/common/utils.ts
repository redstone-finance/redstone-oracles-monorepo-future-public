import { BigNumber } from "ethers";
import {
  arrayify,
  BytesLike,
  formatBytes32String,
  hexlify,
  keccak256,
  parseUnits,
  toUtf8Bytes,
  zeroPad,
  isHexString,
  formatUnits,
} from "ethers/lib/utils";
import { DEFAULT_NUM_VALUE_DECIMALS } from "./redstone-constants";

const ZERO_EX_PREFIX_LENGTH = 2; // length of string "0x"

export type NumberLike = number | string;

export type ConvertibleToBytes32 = string;

export const assert = (condition: boolean, errMsg?: string) => {
  if (!condition) {
    const errText = `Assertion failed` + (errMsg ? `: ${errMsg}` : "");
    throw new Error(errText);
  }
};

export const convertStringToBytes32 = (str: string): Uint8Array => {
  let bytes32Str: string;
  if (str.length > 31) {
    bytes32Str = keccak256(isHexString(str) ? str : toUtf8Bytes(str));
  } else {
    bytes32Str = formatBytes32String(str);
  }
  return arrayify(bytes32Str);
};

export const convertNumberToBytes = (
  value: NumberLike,
  decimals: number,
  byteSize: number,
  roundFractionalComponentIfExceedsDecimals: boolean = true
): Uint8Array => {
  let stringifiedNumber = roundFractionalComponentIfExceedsDecimals
    ? Number(value).toFixed(decimals)
    : String(value);

  // js for numbers >1e20 uses scientific notation,
  // which is not supported by BigNumber.js
  if (stringifiedNumber.includes("e")) {
    stringifiedNumber = Number(stringifiedNumber).toLocaleString("fullwide", {
      useGrouping: false,
    });
  }

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
  assert(
    Number.isInteger(Number(value)),
    "convertIntegerNumberToBytes expects integer as input"
  );
  const decimals = 0; // 0 digits after comma
  return convertNumberToBytes(value, decimals, byteSize);
};

export const convertBytesToNumber = (bytes: Uint8Array): number =>
  BigNumber.from(bytes).toNumber();

export const convertAndSerializeBytesToNumber = (
  bytes: Uint8Array,
  decimals: number = DEFAULT_NUM_VALUE_DECIMALS
): number => {
  return Number(formatUnits(BigNumber.from(bytes), decimals));
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

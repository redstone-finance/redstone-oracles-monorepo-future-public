import Decimal from "decimal.js";
import { BigNumber } from "ethers";
import {
  BytesLike,
  arrayify,
  formatBytes32String,
  hexlify,
  isHexString,
  keccak256,
  parseUnits,
  toUtf8Bytes,
  zeroPad,
} from "ethers/lib/utils";

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
  byteSize: number
): Uint8Array => {
  const stringifiedNumber = convertNumberToString(value, decimals);
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

export const convertNumberToString = (
  value: NumberLike,
  decimals: number
): string => {
  const decimalValue = new Decimal(value);
  return decimalValue.toFixed(decimals);
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

export const hexlifyWithout0xPrefix = (value: BytesLike): string => {
  return hexlify(value).slice(ZERO_EX_PREFIX_LENGTH);
};

export function useDefaultIfUndefined<T>(
  value: T | undefined,
  defaultValue: T
): T {
  return value === undefined ? defaultValue : value;
}

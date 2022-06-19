import {
  arrayify,
  formatBytes32String,
  keccak256,
  parseUnits,
  toUtf8Bytes,
  zeroPad,
} from "ethers/lib/utils";

export type NumberLike = number | string;

export type ConvertableToBytes32 = any;

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
  byteSize: number
): Uint8Array => {
  const bigNumberValue = parseUnits(String(value), decimals);
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

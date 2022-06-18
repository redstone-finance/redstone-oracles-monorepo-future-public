import {
  arrayify,
  formatBytes32String,
  keccak256,
  zeroPad,
} from "ethers/lib/utils";

const HEX_STRING_RADIX = 16;

export type ConvertableToBytes32 = any;

export const assert = (condition: boolean, errMsg?: string) => {
  if (!condition) {
    const errText = `Assertion failed` + (errMsg ? `: ${errMsg}` : "");
    throw new Error(errText);
  }
};

export const convertStringToBytes32 = (str: string): Uint8Array => {
  const bytes32Str: string =
    str.length > 31 ? keccak256(str) : formatBytes32String(str);
  return arrayify(bytes32Str);
};

export const convertNumberToBytes = (
  value: number,
  precision: number,
  byteSize: number
): Uint8Array => {
  const bigIntValue: BigInt = BigInt(Math.round(value * 10 ** precision));
  const hexValue = bigIntValue.toString(HEX_STRING_RADIX);
  const bytesValue = arrayify(hexValue);
  if (byteSize < bytesValue.length) {
    throw new Error(
      `Overflow: ${JSON.stringify({ value, precision, byteSize })}`
    );
  } else {
    return zeroPad(bytesValue, byteSize - bytesValue.length);
  }
};

export const convertIntegerNumberToBytes = (
  value: number,
  byteSize: number
): Uint8Array => {
  const precision = 0; // 0 digits after comma
  return convertNumberToBytes(value, precision, byteSize);
};

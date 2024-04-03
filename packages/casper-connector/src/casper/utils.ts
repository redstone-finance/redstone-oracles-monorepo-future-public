import { CLU256, CLU8, CLValue, CLValueBuilder } from "casper-js-sdk";
import { CLList } from "casper-js-sdk/dist/lib/CLValue/List";
import { BigNumber } from "ethers";
import { arrayify, hexlify, toUtf8String } from "ethers/lib/utils";

export function encodeByteCLList(param: string) {
  const bytes = Array.from(
    arrayify(param.startsWith("0x") ? param : "0x" + param)
  );
  const u8List = bytes.map(CLValueBuilder.u8);

  return CLValueBuilder.list(u8List);
}

export function encodeCLU256(value: string) {
  return CLValueBuilder.u256(
    arrayify(value.startsWith("0x") ? value : "0x" + value)
  );
}

export function decodeValue<T>(value: unknown) {
  return (value as CLValue).value() as T;
}

export function decodeNumber(value: unknown) {
  return decodeValue<BigNumber>(value).toNumber();
}

export function decodeCLList<T extends CLValue, U>(list: CLList<T>): U[] {
  return list.value().map((v: T) => {
    return v.value() as U;
  });
}

export function decodeStringCLList(list: unknown): string[] {
  return (list as CLList<CLU256>)
    .value()
    .map((x) => toUtf8String(hexlify(x.value())));
}

export function decodeHex(bytes: unknown) {
  const byteList: BigNumber[] = decodeCLList(bytes as CLList<CLU8>);

  return hexlify(byteList.map((v) => v.toNumber())).substring(2);
}

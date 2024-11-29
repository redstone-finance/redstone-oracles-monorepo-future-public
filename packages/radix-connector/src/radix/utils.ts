import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";
import { array, u8, ValueKind } from "@radixdlt/radix-engine-toolkit";
import { arrayify } from "ethers/lib/utils";

export function makeBytes(arr: number[]) {
  return array(ValueKind.U8, ...arr.map(u8));
}

export function makeFeedIds(arr: string[]) {
  const feedArrays = arr.map((feedId) => Array.from(toUtf8Bytes(feedId)));

  return array(ValueKind.Array, ...feedArrays.map(makeBytes));
}

export function makeSigners(arr: string[]) {
  const feedArrays = arr.map((feedId) => Array.from(arrayify(feedId)));

  return array(ValueKind.Array, ...feedArrays.map(makeBytes));
}

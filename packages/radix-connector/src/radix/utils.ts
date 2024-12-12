import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";
import {
  address,
  array,
  enumeration,
  nonFungibleLocalId,
  tuple,
  u8,
  Value,
  ValueKind,
} from "@radixdlt/radix-engine-toolkit";
import { arrayify } from "ethers/lib/utils";

export interface NonFungibleGlobalIdInput {
  resourceAddress: string;
  localId: string;
}

export function makeNonFungibleGlobalId(input: NonFungibleGlobalIdInput) {
  return tuple(
    address(input.resourceAddress),
    nonFungibleLocalId(input.localId)
  );
}

export function makeOption<T>(
  creator: (arg0: T) => Value,
  valueOrUndefined?: T
) {
  return enumeration(
    valueOrUndefined ? 1 : 0,
    ...(valueOrUndefined ? [creator(valueOrUndefined)] : [])
  );
}

export function makeBytes(arr: number[]) {
  return array(ValueKind.U8, ...arr.map(u8));
}

export function makeFeedId(feedId: string) {
  const feedIdArr = Array.from(toUtf8Bytes(feedId));

  return makeBytes(feedIdArr);
}

export function makeFeedIds(arr: string[]) {
  return array(ValueKind.Array, ...arr.map(makeFeedId));
}

export function makeSigners(arr: string[]) {
  const signerArrays = arr.map((signer) => Array.from(arrayify(signer)));

  return array(ValueKind.Array, ...signerArrays.map(makeBytes));
}

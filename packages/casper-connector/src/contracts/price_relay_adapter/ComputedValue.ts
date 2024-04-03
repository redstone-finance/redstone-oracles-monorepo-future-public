import { CLList, CLTuple3, CLU256 } from "casper-js-sdk";
import { BigNumberish } from "ethers";
import {
  decodeCLList,
  decodeNumber,
  decodeStringCLList,
} from "../../casper/utils";

export type ComputedValue = {
  timestamp: number;
  feedIds: string[];
  values: BigNumberish[];
};

export function computedValueDecoder(value: unknown): ComputedValue[] {
  return (value as CLTuple3[])
    .map((tuple) => tuple.value())
    .map((value) => {
      return {
        timestamp: decodeNumber(value[0]),
        feedIds: decodeStringCLList(value[1]),
        values: decodeCLList(value[2] as CLList<CLU256>),
      };
    });
}

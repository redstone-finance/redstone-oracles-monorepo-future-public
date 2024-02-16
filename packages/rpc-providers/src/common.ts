import { BlockTag } from "@ethersproject/abstract-provider";
import { ErrorCode } from "@ethersproject/logger";

export const sleepMS = (ms: number) =>
  new Promise((resolve, _reject) => setTimeout(resolve, ms));

/** Assumes that if blockTag is string the it is hex string */
export const convertBlockTagToNumber = (blockTag: BlockTag): number =>
  typeof blockTag === "string" ? convertHexToNumber(blockTag) : blockTag;

export const convertHexToNumber = (hex: string): number => {
  const number = Number.parseInt(hex, 16);
  if (Number.isNaN(number)) {
    throw new Error(`Failed to parse ${hex} to number`);
  }
  return number;
};

export type EthersError = { code: ErrorCode; message: string };

export const isEthersError = (e: unknown): e is EthersError => {
  const error = e as Partial<EthersError>;
  return !!error.code && !!error.message;
};

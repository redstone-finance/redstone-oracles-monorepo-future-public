import axios, { AxiosResponse } from "axios";
import { BlockTag } from "@ethersproject/abstract-provider";
import { ErrorCode } from "@ethersproject/logger";

export const sleepMS = (ms: number) =>
  new Promise((resolve, _reject) => setTimeout(resolve, ms));

const FETCH_CACHE: Record<
  string,
  { response: AxiosResponse; capturedAt: number } | undefined
> = {};
export const fetchWithCache = async <T>(url: string, ttl: number) => {
  if (FETCH_CACHE[url] && Date.now() - FETCH_CACHE[url]!.capturedAt <= ttl) {
    return FETCH_CACHE[url]!.response as AxiosResponse<T>;
  }
  const capturedAt = Date.now();
  const response = await axios.get(url);

  FETCH_CACHE[url] = { response, capturedAt };

  return response as AxiosResponse<T>;
};

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

import { BlockTag } from "@ethersproject/abstract-provider";
import { ErrorCode } from "@ethersproject/logger";
import { Point } from "@influxdata/influxdb-client";
import { providers } from "ethers";

export type ReportMetricFn = (message: Point) => void;
export type ContractCallOverrides = { blockTag: BlockTag };
export type EthersError = { code: ErrorCode; message: string };

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

export const isEthersError = (e: unknown): e is EthersError => {
  const error = e as Partial<EthersError>;
  return !!error.code && !!error.message;
};

export function getProviderNetworkInfo(
  provider: providers.Provider,
  defaultVal = { chainId: 31337, url: "unknown" }
) {
  try {
    if (provider instanceof providers.JsonRpcProvider) {
      return {
        chainId: provider.network.chainId,
        url: provider.connection.url,
      };
    }
  } catch {
    /* This happens in mocha tests...*/
    return defaultVal;
  }

  return defaultVal;
}

/** In fact it is sync function cause our provider has static assigned network id */
export async function getProviderChainId(provider: providers.Provider) {
  const network = await provider.getNetwork();
  return network.chainId;
}

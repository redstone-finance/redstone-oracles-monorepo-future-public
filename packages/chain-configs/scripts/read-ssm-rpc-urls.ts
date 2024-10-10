import { getSSMParameterValue } from "@redstone-finance/internal-utils";
import { RedstoneCommon } from "@redstone-finance/utils";
import { z } from "zod";
import { getLocalChainConfigs } from "../src";

export type RpcUrlsPerChain = {
  [name: string]: {
    chainId: number;
    rpcUrls: string[];
  };
};

const env = RedstoneCommon.getFromEnv("ENV", z.string().default("dev"));
const isFallback = RedstoneCommon.getFromEnv(
  "FALLBACK",
  z.boolean().default(false)
);

export const readSsmRpcUrls = async (): Promise<RpcUrlsPerChain> => {
  const chainConfigs = getLocalChainConfigs();
  const rpcUrlsPerChain: RpcUrlsPerChain = {};

  const fallbackInfix = isFallback ? "/fallback" : "";
  const region = isFallback ? "eu-north-1" : "eu-west-1";
  for (const { name, chainId } of Object.values(chainConfigs)) {
    if (name === "hardhat") {
      continue;
    }
    try {
      const ssmRpcUrls = await getSSMParameterValue(
        `/${env}/rpc/${chainId}${fallbackInfix}/urls`,
        region
      );
      const rpcUrls = JSON.parse(ssmRpcUrls!) as string[];
      rpcUrlsPerChain[name] = {
        chainId,
        rpcUrls,
      };
    } catch (e) {
      console.error(
        `Rpc urls for chain ${name} (${chainId}) not present in ${env} SSM: ${RedstoneCommon.stringifyError(e)}`
      );
    }
  }
  return rpcUrlsPerChain;
};

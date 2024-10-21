import { getSSMParameterValue } from "@redstone-finance/internal-utils";
import { RedstoneCommon } from "@redstone-finance/utils";
import chalk from "chalk";
import { z } from "zod";
import { getLocalChainConfigs } from "../src";

export type RpcUrlsPerChain = {
  [name: string]: {
    chainId: number;
    rpcUrls: string[];
  };
};

const env = RedstoneCommon.getFromEnv("ENV", z.string().default("dev"));

export const readSsmRpcUrls = async (
  isFallback: boolean
): Promise<RpcUrlsPerChain> => {
  const chainConfigs = getLocalChainConfigs();
  const rpcUrlsPerChain: RpcUrlsPerChain = {};

  for (const { name, chainId } of Object.values(chainConfigs)) {
    if (name === "hardhat") {
      continue;
    }
    try {
      const path = `/${env}/rpc/${chainId}/${isFallback ? "fallback/" : ""}urls`;
      const region = isFallback ? "eu-north-1" : undefined;
      const ssmRpcUrls = await getSSMParameterValue(path, region);
      const rpcUrls = JSON.parse(ssmRpcUrls!) as string[];

      rpcUrlsPerChain[name] = {
        chainId,
        rpcUrls,
      };
    } catch {
      console.log(
        chalk.yellow(
          `${isFallback ? "Fallback" : "Main"} Rpc urls for chain ${name} (${chainId}) not present in ${env} SSM`
        )
      );
    }
  }
  return rpcUrlsPerChain;
};

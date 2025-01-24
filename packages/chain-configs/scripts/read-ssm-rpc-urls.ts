import { RedstoneCommon } from "@redstone-finance/utils";
import chalk from "chalk";
import { z } from "zod";
import { fetchRpcUrlsFromSsm, getLocalChainConfigs } from "../src";

export type RpcUrlsPerChain = {
  [name: string]: {
    chainId: number;
    rpcUrls: string[];
  };
};

const env = RedstoneCommon.getFromEnv(
  "ENV",
  z.enum(["dev", "prod"]).default("dev")
);

export const readSsmRpcUrls = async (
  isFallback: boolean,
  specificChainId?: number
): Promise<RpcUrlsPerChain> => {
  const chainConfigs = getLocalChainConfigs();
  const rpcUrlsPerChain: RpcUrlsPerChain = {};

  const chainIds = Object.values(chainConfigs).map((c) => c.chainId);
  const rpcUrls = await fetchRpcUrlsFromSsm({
    chainIds: chainIds,
    type: isFallback ? "fallback" : "main",
    env,
  });

  for (const { name, chainId } of Object.values(chainConfigs)) {
    if (
      name === "hardhat" ||
      (specificChainId && chainId !== specificChainId)
    ) {
      continue;
    }
    try {
      if (!rpcUrls[chainId]) {
        throw new Error("missing rpc url in ssm");
      }

      rpcUrlsPerChain[name] = {
        chainId,
        rpcUrls: rpcUrls[chainId],
      };
    } catch (e) {
      console.log(
        chalk.yellow(
          `${isFallback ? "Fallback" : "Main"} Rpc urls for chain ${name} (${chainId}) not present in ${env} SSM error=${RedstoneCommon.stringifyError(e)}`
        )
      );
    }
  }
  return rpcUrlsPerChain;
};

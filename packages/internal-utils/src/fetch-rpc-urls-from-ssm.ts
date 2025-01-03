import { RedstoneCommon } from "@redstone-finance/utils";
import _ from "lodash";
import { getSSMParameterValue } from "./aws/params";

export type FetchRpcUrlsFromSsmOpts = {
  type: "fallback" | "main";
  env: "dev" | "prod";
  chainIds: number[];
};

export type FetchRpcUrlsFromSsmResult = Record<number, string[] | undefined>;

const BATCH_SIZE = 10;

export async function fetchRpcUrlsFromSsm(
  opts: FetchRpcUrlsFromSsmOpts
): Promise<FetchRpcUrlsFromSsmResult> {
  const chainIdsChunks = _.chunk(opts.chainIds, BATCH_SIZE);

  const result: Record<number, string[]> = {};

  for (const chainIds of chainIdsChunks) {
    await Promise.all(
      chainIds.map(async (chainId) => {
        const rpcUrlsForChainId = await fetchRpcUrlsFromSsmByChainId(
          chainId,
          opts.type,
          opts.env
        );
        if (rpcUrlsForChainId) {
          result[chainId] = JSON.parse(rpcUrlsForChainId) as string[];
        } else {
          throw new Error(
            `Failed to get rpcUrls for chainId=${chainId}: getSSMParameterValue returned empty value`
          );
        }
      })
    );
  }

  return result;
}

async function fetchRpcUrlsFromSsmByChainId(
  chainId: number,
  type: FetchRpcUrlsFromSsmOpts["type"],
  env: FetchRpcUrlsFromSsmOpts["env"]
): Promise<string | undefined> {
  try {
    const path = `/${env}/rpc/${chainId}/${type === "fallback" ? "fallback/" : ""}urls`;
    const region = type === "fallback" ? "eu-north-1" : undefined;
    return await getSSMParameterValue(path, region);
  } catch (e) {
    if ((e as Error).name !== "ParameterNotFound") {
      throw new Error(
        `Failed to get rpcUrls for chainId=${chainId}: ${RedstoneCommon.stringifyError(e)}`
      );
    }
    return undefined;
  }
}

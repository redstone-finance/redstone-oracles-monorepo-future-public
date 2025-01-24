import { getSSMParameterValue } from "@redstone-finance/internal-utils";
import { RedstoneCommon } from "@redstone-finance/utils";
import _ from "lodash";

export type FetchRpcUrlsFromSsmOpts = {
  type: "fallback" | "main";
  env: "dev" | "prod" | "staging";
  chainIds: number[];
};

export type FetchRpcUrlsFromSsmResult = Record<number, string[] | undefined>;

const BATCH_SIZE = 10;
const RETRY_CONFIG: Omit<RedstoneCommon.RetryConfig, "fn"> = {
  maxRetries: 3,
  waitBetweenMs: 1000,
  backOff: {
    backOffBase: 2,
  },
};

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
          opts.env,
          opts.type
        );

        if (rpcUrlsForChainId) {
          result[chainId] = JSON.parse(rpcUrlsForChainId) as string[];
        }
      })
    );
  }

  return result;
}

export async function fetchRpcUrlsFromSsmByChainId(
  chainId: number | string,
  env: FetchRpcUrlsFromSsmOpts["env"],
  type: FetchRpcUrlsFromSsmOpts["type"] = "main"
): Promise<string | undefined> {
  try {
    const path = `/${env}/rpc/${chainId}/${type === "fallback" ? "fallback/" : ""}urls`;
    const region = type === "fallback" ? "eu-north-1" : undefined;

    return await RedstoneCommon.retry({
      fn: () => getSSMParameterValue(path, region),
      ...RETRY_CONFIG,
    })();
  } catch (e) {
    if ((e as Error).name !== "ParameterNotFound") {
      throw new Error(
        `Failed to get rpcUrls for chainId=${chainId}: ${RedstoneCommon.stringifyError(e)}`
      );
    }
    return undefined;
  }
}

export async function fetchParsedRpcUrlsFromSsmByChainId(
  chainId: number | string,
  env: FetchRpcUrlsFromSsmOpts["env"],
  type: FetchRpcUrlsFromSsmOpts["type"] = "main"
) {
  const ssmRpcUrls = await fetchRpcUrlsFromSsmByChainId(chainId, env, type);
  if (!ssmRpcUrls) {
    throw new Error(`${env} RPC URLs not found for ${chainId}`);
  }

  return JSON.parse(ssmRpcUrls) as string[];
}

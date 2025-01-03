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
        const path = `/${opts.env}/rpc/${chainId}/${opts.type === "fallback" ? "fallback/" : ""}urls`;
        let rpcUrls: string | undefined;
        try {
          const region = opts.type === "fallback" ? "eu-north-1" : undefined;
          rpcUrls = await getSSMParameterValue(path, region);
        } catch (e) {
          if ((e as Error).name !== "ParameterNotFound") {
            throw new Error(
              `Failed to get rpcUrls for chainId=${chainId}: ${RedstoneCommon.stringifyError(e)}`
            );
          }
          return;
        }
        if (!rpcUrls) {
          return;
        }
        result[chainId] = JSON.parse(rpcUrls) as string[];
      })
    );
  }

  return result;
}

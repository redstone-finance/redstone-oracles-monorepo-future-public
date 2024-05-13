import { BlockTag } from "@ethersproject/abstract-provider";
import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { Contract, providers } from "ethers";
import {
  getChainConfigByChainId,
  getMulticall3,
  getNetworkName,
} from "../../chains-configs/helpers";

export type Multicall3Request = {
  target: string;
  allowFailure: boolean;
  callData: string;
  gasLimit?: number;
};

export type Multicall3Result = {
  returnData: string;
  fallbackRejectReason?: unknown;
};

function rawMulticall3(
  multicall3Contract: Contract,
  call3s: Multicall3Request[],
  blockTag?: BlockTag
): Promise<Multicall3Result[]> {
  return multicall3Contract.callStatic.aggregate3(call3s, {
    blockTag,
  }) as Promise<Multicall3Result[]>;
}

const logger = loggerFactory("multicall3");

export async function multicall3(
  provider: providers.Provider,
  call3s: Multicall3Request[],
  blockTag?: BlockTag,
  multicallAddress?: string
): Promise<Multicall3Result[]> {
  const chainId = (await provider.getNetwork()).chainId;
  const multicall3Contract = getMulticall3(
    getNetworkName(chainId),
    multicallAddress
  );

  try {
    return await rawMulticall3(
      multicall3Contract.connect(provider),
      call3s,
      blockTag
    );
  } catch (e) {
    // if multicall failed fallback to normal execution model (1 call = 1 request)
    logger.log(
      `multicall3 chainId=${chainId} failed. Will fallback to ${
        call3s.length
      } separate calls. Error: ${RedstoneCommon.stringifyError(e)}`
    );

    const chainConfig = getChainConfigByChainId(chainId);
    const gasLimit =
      chainConfig.multicall3.type === "RedstoneMulticall3"
        ? chainConfig.multicall3.gasLimitPerCall
        : undefined;

    return await Promise.all(
      call3s.map((call3) => fallbackCall(provider, call3, blockTag, gasLimit))
    );
  }
}
async function fallbackCall(
  provider: providers.Provider,
  call3: Multicall3Request,
  blockTag: BlockTag | undefined,
  gasLimit?: number
) {
  try {
    const callResult = await provider.call(
      { to: call3.target, data: call3.callData, gasLimit },
      blockTag
    );
    return {
      returnData: callResult,
    };
  } catch (e) {
    logger.log("multicall3 fallback call failed");
    return {
      returnData: "0x",
      fallbackRejectReason: e,
    };
  }
}

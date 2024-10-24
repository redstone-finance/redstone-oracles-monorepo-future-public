import { BlockTag } from "@ethersproject/abstract-provider";
import {
  getLocalChainConfigsByChainId,
  getMulticall3,
} from "@redstone-finance/chain-configs";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import { Contract, providers } from "ethers";

export type Multicall3Request = {
  target: string;
  allowFailure: boolean;
  callData: string;
  gasLimit?: number;
};

export type Multicall3Result = {
  returnData: string;
  fallbackRejectReason?: unknown;
  success: boolean;
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
const chainConfigsByChainId = getLocalChainConfigsByChainId();

/** [TURBO IMPORTANT] this function MUST NOT throw errors */
export async function safeExecuteMulticall3(
  provider: providers.Provider,
  call3s: Multicall3Request[],
  retryBySingleCalls: boolean,
  blockTag?: BlockTag,
  multicallAddress?: string
): Promise<Multicall3Result[]> {
  let chainId = -1;
  try {
    chainId = (await provider.getNetwork()).chainId;
    const multicall3Contract = getMulticall3(
      {
        chainId: chainId,
        overrideAddress: multicallAddress,
        signerOrProvider: provider,
      },
      chainConfigsByChainId[chainId]
    );
    return await rawMulticall3(multicall3Contract, call3s, blockTag);
  } catch (e) {
    if (retryBySingleCalls) {
      // if whole multicall failed & retryBySingleCalls is disabled, fallback to normal execution model (1 call = 1 request)
      logger.error(
        `Whole multicall3 chainId=${chainId} failed. Will fallback to ${
          call3s.length
        } separate calls. Error: ${RedstoneCommon.stringifyError(e)}`
      );

      return await Promise.all(
        call3s.map((call3) => safeFallbackCall(provider, call3, blockTag))
      );
    } else {
      logger.error(
        `Whole multicall3 chainId=${chainId} failed. Will not fallback. Error: ${RedstoneCommon.stringifyError(e)}`
      );

      return call3s.map(() => ({
        returnData: "0x",
        fallbackRejectReason: `Whole multicall3 chainId=${chainId} failed. Will not fallback.`,
        success: false,
      }));
    }
  }
}

/* we intentionally ignore gasLimit,
 * because if call failed on RedstoneMulticall3 it was probably caused by gasLimit
 */
async function safeFallbackCall(
  provider: providers.Provider,
  call3: Multicall3Request,
  blockTag: BlockTag | undefined
) {
  try {
    const callResult = await provider.call(
      { to: call3.target, data: call3.callData },
      blockTag
    );
    logger.debug(
      `fallback call succeeded to=${call3.target} data=${call3.callData} blockTag=${blockTag}`
    );
    return {
      returnData: callResult,
      success: true,
    };
  } catch (e) {
    logger.log(
      `fallback call failed to=${call3.target} data=${call3.callData} blockTag=${blockTag}`
    );
    return {
      returnData: "0x",
      fallbackRejectReason: e,
      success: false,
    };
  }
}

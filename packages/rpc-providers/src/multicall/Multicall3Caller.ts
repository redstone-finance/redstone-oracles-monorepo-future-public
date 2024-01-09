import { BlockTag } from "@ethersproject/abstract-provider";
import { RedstoneCommon } from "@redstone-finance/utils";
import { BytesLike, Contract, providers } from "ethers";
import { abi } from "./Multicall3.abi.json";

const MULTICALL_DETERMINISTIC_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11";

// https://github.com/mds1/multicall#batch-contract-reads
export type Multicall3Request = {
  target: string;
  allowFailure: boolean;
  callData: BytesLike;
};

export type Multicall3Result = {
  returnData: string;
  fallbackRejectReason?: unknown;
};

const DEFAULT_MULTICALL3_CONTRACT = new Contract(
  MULTICALL_DETERMINISTIC_ADDRESS,
  abi
);

function rawMulticall3(
  multicall3Contract: Contract,
  call3s: Multicall3Request[],
  blockTag?: BlockTag
): Promise<Multicall3Result[]> {
  return multicall3Contract.callStatic.aggregate3(call3s, {
    blockTag,
  }) as Promise<Multicall3Result[]>;
}

export async function multicall3(
  provider: providers.Provider,
  call3s: Multicall3Request[],
  blockTag?: BlockTag,
  multicallAddress?: string
): Promise<Multicall3Result[]> {
  const multicall3Contract = multicallAddress
    ? new Contract(multicallAddress, abi)
    : DEFAULT_MULTICALL3_CONTRACT;

  try {
    return await rawMulticall3(
      multicall3Contract.connect(provider),
      call3s,
      blockTag
    );
  } catch (e) {
    // if multicall failed fallback to normal execution model (1 call = 1 request)
    console.log(
      `[multicall3] failed. Will fallback to ${
        call3s.length
      } separate calls. Error: ${RedstoneCommon.stringifyError(e)}`
    );
    return await Promise.all(
      call3s.map((call3) => fallbackCall(provider, call3, blockTag))
    );
  }
}
async function fallbackCall(
  provider: providers.Provider,
  call3: Multicall3Request,
  blockTag: BlockTag | undefined
) {
  try {
    const callResult = await provider.call(
      { to: call3.target, data: call3.callData },
      blockTag
    );
    return {
      returnData: callResult,
    };
  } catch (e) {
    console.log("[multicall3] Fallback call failed");
    return {
      returnData: "0x",
      fallbackRejectReason: e,
    };
  }
}

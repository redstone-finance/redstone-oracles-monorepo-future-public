import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { getLocalChainConfigsByChainId } from "@redstone-finance/chain-configs";
import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import { providers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import { z } from "zod";
import { Multicall3Request, safeExecuteMulticall3 } from "./Multicall3Caller";
import { MulticallBuffer } from "./MulticallBuffer";

const chainConfigPerChainId = getLocalChainConfigsByChainId();

async function prepareMulticall3Request(
  tx: Deferrable<TransactionRequest>,
  chainId: number
) {
  const call: Multicall3Request = {
    callData: (await tx["data"]) as string,
    target: (await tx["to"]) as string,
    allowFailure: true,
  };

  const multicall3Info = chainConfigPerChainId[chainId].multicall3;

  if (multicall3Info.type === "RedstoneMulticall3") {
    call.gasLimit = multicall3Info.gasLimitPerCall;
  }

  return call;
}

const logger = loggerFactory("MulticallProvider");

export type MulticallDecoratorOptions = {
  maxCallsCount?: number;
  maxCallDataSize?: number;
  /** If set to -1 auto resolve is disabled */
  autoResolveInterval?: number;
  multicallAddress?: string;
  retryBySingleCalls?: boolean;
};

const parseMulticallConfig = (opts: MulticallDecoratorOptions) => {
  return {
    multicallAddress:
      opts.multicallAddress ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_CONTRACT_ADDRESS",
        z.string().optional()
      ),
    autoResolveInterval:
      opts.autoResolveInterval ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_AUTO_RESOLVE_INTERVAL",
        z.number().default(100)
      ),
    maxCallsCount:
      opts.maxCallsCount ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_MAX_CALLS_COUNT",
        z.number().default(15)
      ),
    maxCallDataSize:
      opts.maxCallDataSize ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_MAX_CALL_DATA_SIZE",
        z.number().default(50_000)
      ), // 0.05MB
    retryBySingleCalls:
      opts.retryBySingleCalls ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_RETRY_BY_SINGLE_CALLS",
        z.boolean().default(true)
      ),
  };
};

export function MulticallDecorator<T extends providers.Provider>(
  buildProvider: () => T,
  options: MulticallDecoratorOptions = {}
): () => T {
  const config = parseMulticallConfig(options);
  const originalProvider = buildProvider();
  const modifiedProvider = RedstoneCommon.cloneClassInstance(originalProvider);
  const queue = new MulticallBuffer(
    config.maxCallsCount,
    config.maxCallDataSize
  );

  let chainId: number | undefined = undefined;
  const chainIdPromise = originalProvider.getNetwork().then((n) => n.chainId);

  const executeCallsFromQueue = (blockTag: BlockTag | undefined) => {
    const callDataSize = queue.callDataSize(blockTag);
    const callEntries = queue.flush(blockTag);

    logger.debug(
      `Executing request chainId=${chainId} blockTag=${blockTag} callsCount=${callEntries.length} callDataSize=${callDataSize} [bytes]`
    );

    safeExecuteMulticall3(
      originalProvider,
      callEntries,
      config.retryBySingleCalls,
      blockTag,
      config.multicallAddress
    )
      .then((result3s) => {
        for (let i = 0; i < result3s.length; i++) {
          // we should handle fallback specially because they can fail partially
          if (result3s[i].fallbackRejectReason) {
            callEntries[i].reject(result3s[i].fallbackRejectReason);
          } else {
            callEntries[i].resolve(result3s[i].returnData);
          }
        }
      })
      .catch((e) => {
        logger.log(
          `call failed rejecting ${callEntries.length} bounded promises`
        );
        // if multicall fails we have to reject all promises bounded to it
        for (const entry of callEntries) {
          entry.reject(e);
        }
      });
  };

  const call = async (
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag | Promise<BlockTag>
  ): Promise<string> => {
    chainId = await chainIdPromise;
    const multicall3Request = await prepareMulticall3Request(
      transaction,
      chainId
    );
    const resolvedBlockTag = await blockTag;

    const { promise, resolve, reject } = createDeferredPromise<string>();
    const entry = {
      ...multicall3Request,
      blockTag: resolvedBlockTag,
      resolve,
      reject,
    };

    if (queue.willCallDataSizeBeExceeded(resolvedBlockTag, entry)) {
      executeCallsFromQueue(resolvedBlockTag);
    }

    queue.push(resolvedBlockTag, entry);

    if (queue.isCallsCountFull(resolvedBlockTag)) {
      executeCallsFromQueue(resolvedBlockTag);
    }

    return await promise;
  };

  const resolveBuffersForAllBlocks = () => {
    const flushedCallsByBlockId = queue.pickAll();
    for (const [_, callEntries] of flushedCallsByBlockId) {
      executeCallsFromQueue(callEntries[0].blockTag);
    }
  };

  if (config.autoResolveInterval > 0) {
    const interval = setInterval(
      resolveBuffersForAllBlocks,
      config.autoResolveInterval
    );
    interval.unref();
  }

  modifiedProvider.call = call;

  return () => modifiedProvider;
}

function createDeferredPromise<T>() {
  let resolve: (data: T) => void;
  let reject: (reason?: unknown) => void;

  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });

  return { promise, resolve: resolve!, reject: reject! };
}

import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { providers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import {
  MULTICALL3_DETERMINISTIC_ADDRESS,
  multicall3,
} from "./Multicall3Caller";
import { MulticallBuffer } from "./MulticallBuffer";
import { RedstoneCommon } from "@redstone-finance/utils";
import { z } from "zod";

async function prepareMulticall3Request(tx: Deferrable<TransactionRequest>) {
  return {
    callData: (await tx["data"]) as string,
    target: (await tx["to"]) as string,
    allowFailure: true,
  };
}

const DEFAULT_LOG = (msg: string) => console.log(`[MulticallProvider] ${msg}`);

export type MulticallDecoratorOptions = {
  maxCallsCount?: number;
  maxCallDataSize?: number;
  /** If set to -1 auto resolve is disabled */
  autoResolveInterval?: number;
  multicallAddress?: string;
  log?: (msg: string) => void;
};

const parseMulticallConfig = (
  opts: MulticallDecoratorOptions
): Required<MulticallDecoratorOptions> => {
  return {
    multicallAddress:
      opts.multicallAddress ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_CONTRACT_ADDRESS",
        z.string().default(MULTICALL3_DETERMINISTIC_ADDRESS)
      ),
    autoResolveInterval:
      opts.autoResolveInterval ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_AUTO_RESOLVE_INTERVAL",
        z.number().default(100)
      ),
    log: opts.log ?? DEFAULT_LOG,
    maxCallsCount:
      opts.maxCallsCount ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_MAX_CALLS_COUNT",
        z.number().default(30)
      ),
    maxCallDataSize:
      opts.maxCallDataSize ??
      RedstoneCommon.getFromEnv(
        "MULTICALL_MAX_CALL_DATA_SIZE",
        z.number().default(50_000)
      ), // 0.05MB
  };
};

export function MulticallDecorator<T extends providers.Provider>(
  buildProvider: () => T,
  options: MulticallDecoratorOptions = {}
): () => T {
  const config = parseMulticallConfig(options);
  const modifiedProvider = buildProvider();
  const originalProvider = buildProvider();
  const queue = new MulticallBuffer(
    config.maxCallsCount,
    config.maxCallDataSize
  );

  const executeCallsFromQueue = (blockTag: BlockTag | undefined) => {
    const callDataSize = queue.callDataSize(blockTag);
    const callEntries = queue.flush(blockTag);

    config.log(
      `resolveMulticall: executing multicall3 request blockTag=${blockTag} callsCount=${callEntries.length} callDataSize=${callDataSize} [bytes]`
    );

    multicall3(originalProvider, callEntries, blockTag, config.multicallAddress)
      .then((result3s) => {
        for (let i = 0; i < result3s.length; i++) {
          // we should handle fallback specially because the can fail partially
          if (result3s[i].fallbackRejectReason) {
            callEntries[i].reject(result3s[i].fallbackRejectReason);
          } else {
            callEntries[i].resolve(result3s[i].returnData);
          }
        }
      })
      .catch((e) => {
        config.log(
          `call failed rejecting ${callEntries.length} bounded promises`
        );
        // if multicall fails we have to reject all promises bounded to it
        for (let i = 0; i < callEntries.length; i++) {
          callEntries[i].reject(e);
        }
      });
  };

  const call = async (
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag | Promise<BlockTag>
  ): Promise<string> => {
    const multicall3Request = await prepareMulticall3Request(transaction);
    const resolvedBlockTag = await blockTag;

    const { promise, resolve, reject } = createDeferedPromise<string>();
    const entry = {
      ...multicall3Request,
      blockTag: resolvedBlockTag,
      resolve,
      reject,
    };

    if (queue.willCallDataSizeBeExceeded(resolvedBlockTag, entry)) {
      console.log("CALL DATA SIZE EXCEEDED");
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

function createDeferedPromise<T>() {
  let resolve: (data: T) => void;
  let reject: (reason?: unknown) => void;

  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });

  return { promise, resolve: resolve!, reject: reject! };
}

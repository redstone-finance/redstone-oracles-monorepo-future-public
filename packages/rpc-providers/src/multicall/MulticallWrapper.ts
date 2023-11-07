import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { providers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import { multicall3 } from "./Multicall3Caller";
import { MulticallBuffer } from "./MulticallBuffer";

async function prepareMulticall3Request(tx: Deferrable<TransactionRequest>) {
  return {
    callData: (await tx["data"]) as string,
    target: (await tx["to"]) as string,
    allowFailure: true,
  };
}

const DEFAULT_LOG = (msg: string) => {
  console.log(`[MulticallProvider] ${msg}`);
};

export type MulticallDecoratorOptions = {
  bufferSizePerBlockId: number;
  /** If set to -1 auto resolve is disabled */
  autoResolveInterval: number;
  multicallAddress?: string;
  log?: (msg: string) => void;
};

export function withMulticall<T extends providers.Provider>(
  buildProvider: () => T,
  options: MulticallDecoratorOptions
): T {
  const log = options.log ?? DEFAULT_LOG;
  const modifiedProvider = buildProvider();
  const originalProvider = buildProvider();
  const queue = new MulticallBuffer(options.bufferSizePerBlockId);

  const resolveMulticall = (blockTag: BlockTag | undefined) => {
    const callEntries = queue.flush(blockTag);

    log(
      `resolveMulticall: executing multicall3 request blockTag=${blockTag} callsCount=${callEntries.length}`
    );

    multicall3(
      originalProvider,
      callEntries,
      blockTag,
      options.multicallAddress
    )
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
        log(`call failed rejecting ${callEntries.length} bounded promises`);
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

    queue.push(resolvedBlockTag, {
      ...multicall3Request,
      blockTag: resolvedBlockTag,
      resolve,
      reject,
    });

    if (queue.isFull(resolvedBlockTag)) {
      log(
        `queue for blockTag=${resolvedBlockTag} is full calling resolveMulticall`
      );
      resolveMulticall(resolvedBlockTag);
    }

    return await promise;
  };

  const resolveBuffersForAllBlocks = () => {
    const flushedCallsByBlockId = queue.pickAll();
    for (const [_, callEntries] of flushedCallsByBlockId) {
      resolveMulticall(callEntries[0].blockTag);
    }
  };

  if (options.autoResolveInterval > 0) {
    const interval = setInterval(
      resolveBuffersForAllBlocks,
      options.autoResolveInterval
    );
    interval.unref();
  }

  modifiedProvider.call = call;

  return modifiedProvider;
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

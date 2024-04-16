import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { RedstoneCommon, RedstoneCrypto } from "@redstone-finance/utils";
import { providers } from "ethers";
import { BytesLike, Deferrable } from "ethers/lib/utils";

type CallCacheDecoratorConfig = {
  ttl: number;
};

export function CallCacheDecorator(
  factory: () => providers.Provider,
  config: CallCacheDecoratorConfig
) {
  const newFactory = () => {
    const provider = factory();
    const oldCall = provider.call.bind(provider);

    const memoizedCall = RedstoneCommon.memoize({
      functionToMemoize: oldCall,
      ttl: config.ttl,
      cacheKeyBuilder: txCacheKeyBuilder,
      cleanEveryNIteration: 1_000,
    });

    provider.call = async function (
      tx: Deferrable<TransactionRequest>,
      blockTag?: BlockTag | Promise<BlockTag>
    ) {
      if (await blockTag) {
        return await memoizedCall(tx, blockTag);
      } else {
        return await oldCall(tx, blockTag);
      }
    };

    return provider;
  };

  return newFactory;
}

/**
 * It takes fields of transaction which might have change output
 * of call method
 */
const txCacheKeyBuilder = async (
  transaction: Deferrable<TransactionRequest>,
  blockTag?: BlockTag | Promise<BlockTag>
) =>
  [
    String(await transaction.chainId),
    String(await transaction.to),
    String(await transaction.from),
    await hashBytesLikeValue(transaction.data),
    String(await blockTag),
  ].join("#");

async function hashBytesLikeValue(
  data: BytesLike | undefined | Promise<BytesLike | undefined>
) {
  const awaitedData = await data;
  if (awaitedData) {
    return RedstoneCrypto.sha256ToHex(awaitedData);
  }
  return "";
}

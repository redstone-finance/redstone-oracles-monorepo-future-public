import { RedstoneCommon } from "@redstone-finance/utils";
import { providers } from "ethers";
import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "ethers/lib/utils";

export function wrapCallWithMetric(
  factory: () => providers.StaticJsonRpcProvider,
  reportMetric: (message: string) => void
) {
  const newFactory = () => {
    const provider = factory();

    const oldCall = provider.call.bind(provider);
    provider.call = async (
      transaction: Deferrable<TransactionRequest>,
      blockTag?: BlockTag
    ) => {
      const start = performance.now();
      let isFailure = false;
      try {
        const result = await oldCall(transaction, blockTag);
        isFailure = result === "0x";
        return result;
      } catch (e) {
        isFailure = true;
        throw e;
      } finally {
        const end = performance.now();
        reportMetric(
          RedstoneCommon.makeInfluxMetric(
            "rpc_provider",
            {
              op: "call",
              chainId: provider.network.chainId,
              url: provider.connection.url,
              isFailure,
            },
            {
              blockNumber:
                blockTag && blockTag.toString().startsWith("0x")
                  ? parseInt(blockTag.toString(), 16)
                  : blockTag,
              duration: end - start,
            }
          )
        );
      }
    };
    return provider;
  };

  return newFactory;
}

export function wrapGetBlockNumberWithMetric(
  factory: () => providers.StaticJsonRpcProvider,
  reportMetric: (message: string) => void
) {
  const newFactory = () => {
    const provider = factory();

    const oldGetBlockNumber = provider.getBlockNumber.bind(provider);
    provider.getBlockNumber = async () => {
      const start = performance.now();
      let isFailure = false;
      let blockNumber = -1;

      try {
        const result = await oldGetBlockNumber();
        blockNumber = result;
        return result;
      } catch (e) {
        isFailure = true;
        throw e;
      } finally {
        const end = performance.now();
        reportMetric(
          RedstoneCommon.makeInfluxMetric(
            "rpc_provider",
            {
              op: "getBlockNumber",
              chainId: provider.network.chainId,
              url: provider.connection.url,
              isFailure,
            },
            {
              blockNumber,
              duration: end - start,
            }
          )
        );
      }
    };
    return provider;
  };

  return newFactory;
}

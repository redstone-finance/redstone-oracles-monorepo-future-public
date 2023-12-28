import { providers } from "ethers";
import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "ethers/lib/utils";
import { Point } from "@influxdata/influxdb-client";

export function wrapCallWithMetric(
  factory: () => providers.StaticJsonRpcProvider,
  reportMetric: (message: Point) => void
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
        const point = new Point("rpc_provider")
          .tag("op", "call")
          .tag("chainId", provider.network.chainId.toString())
          .tag("url", provider.connection.url)
          .tag("isFailure", isFailure.toString())
          .floatField("duration", end - start)
          .timestamp(Date.now());
        reportMetric(point);
      }
    };
    return provider;
  };

  return newFactory;
}

export function wrapGetBlockNumberWithMetric(
  factory: () => providers.StaticJsonRpcProvider,
  reportMetric: (message: Point) => void
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
        const point = new Point("rpc_provider")
          .tag("op", "getBlockNumber")
          .tag("chainId", provider.network.chainId.toString())
          .tag("url", provider.connection.url)
          .tag("isFailure", isFailure.toString())
          .floatField("blockNumber", blockNumber)
          .floatField("duration", end - start)
          .timestamp(Date.now());
        reportMetric(point);
      }
    };
    return provider;
  };

  return newFactory;
}

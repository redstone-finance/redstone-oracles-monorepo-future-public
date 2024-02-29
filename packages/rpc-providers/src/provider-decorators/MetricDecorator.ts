import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Point } from "@influxdata/influxdb-client";
import { providers } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import { ReportMetricFn, getProviderNetworkInfo } from "../common";

export function CallMetricDecorator(
  factory: () => providers.Provider,
  reportMetric: ReportMetricFn
) {
  const newFactory = () => {
    const provider = factory();
    const { chainId, url } = getProviderNetworkInfo(provider);

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
          .tag("chainId", chainId.toString())
          .tag("url", url)
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

export function GetBlockNumberMetricDecorator(
  factory: () => providers.Provider,
  reportMetric: ReportMetricFn
) {
  const newFactory = () => {
    const provider = factory();

    const { chainId, url } = getProviderNetworkInfo(provider);
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
          .tag("chainId", chainId.toString())
          .tag("url", url)
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

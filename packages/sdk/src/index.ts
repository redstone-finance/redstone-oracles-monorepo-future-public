import {
  redstoneOraclesInitialState,
  RedstoneOraclesState,
} from "@redstone-finance/oracles-smartweave-contracts";
import {
  INumericDataPoint,
  RedstonePayload,
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "@redstone-finance/protocol";
import { resolveDataServiceUrls } from "./data-services-urls";
import {
  DataPackagesRequestParams,
  requestDataPackages,
} from "./request-data-packages";

export const getOracleRegistryState =
  async (): Promise<RedstoneOraclesState> => {
    return await Promise.resolve(redstoneOraclesInitialState);
  };

export const getDecimalsForDataFeedId = (
  dataPackages: SignedDataPackagePlainObj[]
) => {
  const firstDecimal = (dataPackages[0].dataPoints[0] as INumericDataPoint)
    .decimals;
  const areAllDecimalsEqual = dataPackages.every((dataPackage) =>
    dataPackage.dataPoints.every(
      (dataPoint) => (dataPoint as INumericDataPoint).decimals === firstDecimal
    )
  );

  if (!areAllDecimalsEqual) {
    throw new Error("Decimals from data points in data packages are not equal");
  }
  return firstDecimal;
};

export const requestRedstonePayload = async (
  reqParams: DataPackagesRequestParams,
  format = "hex",
  unsignedMetadataMsg?: string
): Promise<string> => {
  const signedDataPackagesResponse = await requestDataPackages(reqParams);
  const signedDataPackages = Object.values(
    signedDataPackagesResponse
  ).flat() as SignedDataPackage[];

  const payload = new RedstonePayload(
    signedDataPackages,
    unsignedMetadataMsg ?? ""
  );

  switch (format) {
    case "json":
      return JSON.stringify(payload.toObj(), null, 2);
    case "bytes":
      return JSON.stringify(Array.from(payload.toBytes()));
    default:
      return payload.toBytesHexWithout0xPrefix();
  }
};

export default {
  getOracleRegistryState,
  requestRedstonePayload,
  resolveDataServiceUrls,
  getDecimalsForDataFeedId,
};
export * from "./contracts/ContractParamsProvider";
export * from "./contracts/ContractParamsProviderMock";
export * from "./contracts/IContractConnector";
export * from "./contracts/prices/IPriceFeedContractAdapter";
export * from "./contracts/prices/IPricesContractAdapter";
export * from "./contracts/prices/sample-run";
export * from "./data-feed-values";
export * from "./data-services-urls";
export * from "./fetch-data-packages";
export * from "./request-data-packages";
export * from "./simple-relayer/IPriceManagerContractAdapter";
export * from "./simple-relayer/IPriceRoundsFeedContractAdapter";
export * from "./simple-relayer/start-simple-relayer";

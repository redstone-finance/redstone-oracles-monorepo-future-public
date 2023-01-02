import axios from "axios";
import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import redstoneOraclesInitialState from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json";
import {
  RedstonePayload,
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "redstone-protocol";

export const DEFAULT_CACHE_SERVICE_URLS = [
  "https://cache-1.redstone.finance",
  "https://cache-2.redstone.finance",
  "https://cache-3.redstone.finance",
  "https://cache-1-streamr.redstone.finance",
  "https://cache-2-streamr.redstone.finance",
];

const ALL_FEEDS_KEY = "___ALL_FEEDS___";

export interface DataPackagesRequestParams {
  dataServiceId: string;
  uniqueSignersCount: number;
  dataFeeds?: string[];
  disablePayloadsDryRun?: boolean;
}

export interface DataPackagesResponse {
  [dataFeedId: string]: SignedDataPackage[];
}

export const getOracleRegistryState =
  async (): Promise<RedstoneOraclesState> => {
    return redstoneOraclesInitialState;
  };

export const getDataServiceIdForSigner = (
  oracleState: RedstoneOraclesState,
  signerAddress: string
) => {
  for (const nodeDetails of Object.values(oracleState.nodes)) {
    if (nodeDetails.evmAddress.toLowerCase() === signerAddress.toLowerCase()) {
      return nodeDetails.dataServiceId;
    }
  }
  throw new Error(`Data service not found for ${signerAddress}`);
};

const parseDataPackagesResponse = (
  dpResponse: {
    [dataFeedId: string]: SignedDataPackagePlainObj[];
  },
  reqParams: DataPackagesRequestParams
): DataPackagesResponse => {
  const parsedResponse: DataPackagesResponse = {};

  const dataFeedIds = reqParams.dataFeeds ?? [ALL_FEEDS_KEY];

  for (const [dataFeedId, dataFeedPackages] of Object.entries(dpResponse)) {
    if (dataFeedIds.includes(dataFeedId)) {
      parsedResponse[dataFeedId] = dataFeedPackages
        .slice(0, reqParams.uniqueSignersCount)
        .map((dataPackage: SignedDataPackagePlainObj) =>
          SignedDataPackage.fromObj(dataPackage)
        );
    }
  }
  return parsedResponse;
};

const errToString = (e: any): string => {
  if (e instanceof AggregateError) {
    const stringifiedErrors = e.errors.reduce(
      (prev, oneOfErrors, curIndex) =>
        (prev += `${curIndex}: ${oneOfErrors.message}, `),
      ""
    );
    return `${e.message}: ${stringifiedErrors}`;
  } else {
    return e.message;
  }
};

export const requestDataPackages = async (
  reqParams: DataPackagesRequestParams,
  urls: string[] = DEFAULT_CACHE_SERVICE_URLS
): Promise<DataPackagesResponse> => {
  const promises = prepareDataPackagePromises(reqParams, urls);
  try {
    const response = await Promise.any(promises);
    return parseDataPackagesResponse(response.data, reqParams);
  } catch (e: any) {
    const errMessage = `Request failed ${JSON.stringify({
      reqParams,
      urls,
    })}, Original error: ${errToString(e)}`;
    throw new Error(errMessage);
  }
};

const prepareDataPackagePromises = (
  reqParams: DataPackagesRequestParams,
  urls: string[]
) => {
  return urls.map((url) =>
    axios.get(`${url}/data-packages/latest/${reqParams.dataServiceId}`)
  );
};

export const requestRedstonePayload = async (
  reqParams: DataPackagesRequestParams,
  urls: string[] = DEFAULT_CACHE_SERVICE_URLS,
  unsignedMetadataMsg?: string
): Promise<string> => {
  const signedDataPackagesResponse = await requestDataPackages(reqParams, urls);
  const signedDataPackages = Object.values(signedDataPackagesResponse).flat();

  return RedstonePayload.prepare(signedDataPackages, unsignedMetadataMsg || "");
};

export default {
  getOracleRegistryState,
  requestDataPackages,
  getDataServiceIdForSigner,
  requestRedstonePayload,
};

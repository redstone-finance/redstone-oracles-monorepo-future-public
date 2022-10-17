import axios from "axios";
import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import redstoneOraclesInitialState from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json";
import {
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

export interface DataPackagesRequestParams {
  dataServiceId: string;
  uniqueSignersCount: number;
  dataFeeds: string[];
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

const parseDataPackagesResponse = (dpResponse: {
  [dataFeedId: string]: SignedDataPackagePlainObj[];
}): DataPackagesResponse => {
  const parsedResponse: DataPackagesResponse = {};
  for (const [dataFeedId, dataFeedPackages] of Object.entries(dpResponse)) {
    parsedResponse[dataFeedId] = dataFeedPackages.map(
      (dataPackage: SignedDataPackagePlainObj) =>
        SignedDataPackage.fromObj(dataPackage)
    );
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
  //   let errMessage = "";
  //   errMessage += "Aggregate error: ";
  //   e.forEach((oneOfErrors, index) => {
  //     errMessage += `${index}: ${oneOfErrors.message}, `;
  //   });
  //   return errMessage;
  // } else {
  //   return e.message;
  // }
};

export const requestDataPackages = async (
  reqParams: DataPackagesRequestParams,
  urls: string[] = DEFAULT_CACHE_SERVICE_URLS
): Promise<DataPackagesResponse> => {
  const promises = urls.map((url) =>
    axios.get(url + "/data-packages/latest", {
      params: {
        "data-service-id": reqParams.dataServiceId,
        "unique-signers-count": reqParams.uniqueSignersCount,
        "data-feeds": reqParams.dataFeeds.join(","),
      },
    })
  );

  try {
    const response = await Promise.any(promises);
    return parseDataPackagesResponse(response.data);
  } catch (e: any) {
    const errMessage = `Request failed ${JSON.stringify({
      reqParams,
      urls,
    })}, Original error: ${errToString(e)}`;
    throw new Error(errMessage);
  }
};

export default {
  getOracleRegistryState,
  requestDataPackages,
  getDataServiceIdForSigner,
};

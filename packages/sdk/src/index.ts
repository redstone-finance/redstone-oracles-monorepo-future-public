import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import { SignedDataPackage } from "redstone-protocol";
import axios from "axios";

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

// TODO: implement:
// - fetching from difffrent sources
// - fallback mechanism
// - state comparison in diffrent sources
export const getOracleRegistryState =
  async (): Promise<RedstoneOraclesState> => {
    return {
      dataServices: {},
      nodes: {},
      contractAdmins: ["hahah2"],
      canEvolve: true,
      evolve: null,
    };
  };

// TODO: maybe implement lowerification of addresses
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

// TODO: implement
// This function will simply proxy requests to
// the requested cache services (given urls)
// And will return the first valid response
export const requestDataPackages = async (
  reqParams: DataPackagesRequestParams,
  urls: string[] = DEFAULT_CACHE_SERVICE_URLS
): Promise<SignedDataPackage[]> => {
  const response = await axios.get(urls[0], {
    params: {
      ...reqParams,
      "data-feeds": reqParams.dataFeeds.join(","),
    },
  });
  const serializedDataPackages: any[] = response.data;
  throw "TODO";
  // return serializedDataPackages.map((dp) => SignedDataPackage.fromObj(dp));
};

export default {
  getOracleRegistryState,
  requestDataPackages,
  getDataServiceIdForSigner,
};

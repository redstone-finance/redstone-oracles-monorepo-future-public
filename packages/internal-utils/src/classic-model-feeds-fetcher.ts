import axios from "axios";

export interface ProdNodesManifests {
  [manifestName: string]: {
    tokens: {
      [tokenSymbol: string]: {
        source: string[];
        skipBroadcasting?: boolean;
      };
    };
  };
}
interface RelayerManifests {
  [manifestName: string]: {
    priceFeeds: {
      [tokenSymbol: string]: unknown;
    };
  };
}

export interface AllRelayerManifests {
  standard: { [manifestName: string]: RelayerManifests };
  multifeed: { [manifestName: string]: RelayerManifests };
}

const PROD_NODES_MANIFESTS_URL = process.env.PROD_NODES_MANIFESTS_URL;
const ALL_RELAYERS_MANIFESTS_URL = process.env.ALL_RELAYERS_MANIFESTS_URL;

export const getDataFeedsSources = async (
  dataServiceId: string
): Promise<Record<string, string[]>> => {
  if (!PROD_NODES_MANIFESTS_URL || !ALL_RELAYERS_MANIFESTS_URL) {
    throw new Error("Urls for manifests not provided.");
  }

  const priceFeedsSet: Set<string> = new Set();
  const result: Record<string, string[]> = {};

  const relayerManifests = (
    await axios.get<AllRelayerManifests>(ALL_RELAYERS_MANIFESTS_URL)
  ).data;
  const allRelayerManifests = {
    ...relayerManifests.standard,
    ...relayerManifests.multifeed,
  };

  for (const relayerManifest of Object.values(allRelayerManifests)) {
    for (const key of Object.keys(relayerManifest.priceFeeds)) {
      priceFeedsSet.add(key);
    }
  }

  const prodNodesManifests = (
    await axios.get<ProdNodesManifests>(PROD_NODES_MANIFESTS_URL)
  ).data;

  const { tokens } = prodNodesManifests[dataServiceId];

  for (const [symbol, token] of Object.entries(tokens)) {
    if (priceFeedsSet.has(symbol) && !token.skipBroadcasting) {
      result[symbol] = token.source;
    }
  }

  return result;
};

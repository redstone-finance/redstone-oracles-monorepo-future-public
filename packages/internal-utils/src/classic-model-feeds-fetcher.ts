import axios from "axios";

interface ProdNodesManifests {
  [manifestName: string]: {
    tokens: {
      [tokenSymbol: string]: {
        source: string[];
        skipBroadcasting?: boolean;
      };
    };
  };
}

const PROD_NODES_MANIFESTS_URL = process.env.PROD_NODES_MANIFESTS_URL;

export const getDataFeedsSources = async (
  dataServiceId: string
): Promise<Record<string, string[]>> => {
  if (!PROD_NODES_MANIFESTS_URL) {
    throw new Error("Urls for manifests not provided.");
  }
  const result: Record<string, string[]> = {};

  const prodNodesManifests = (
    await axios.get<ProdNodesManifests>(PROD_NODES_MANIFESTS_URL)
  ).data;

  const { tokens } = prodNodesManifests[dataServiceId];

  for (const [symbol, token] of Object.entries(tokens)) {
    if (!token.skipBroadcasting) {
      result[symbol] = token.source;
    }
  }

  return result;
};

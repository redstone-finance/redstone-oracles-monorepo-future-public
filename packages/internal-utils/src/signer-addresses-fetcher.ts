import { fetchFromMonorepo } from "./monorepo-fetcher";

interface Nodes {
  [key: string]: {
    dataServiceId: string;
    evmAddress: string;
  };
}

export const getSignerAddresses = async (dataServiceId: string) => {
  const path =
    "packages/oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json";

  const signerAddresses: Array<string> = [];

  const jsonString = await fetchFromMonorepo(path);

  const { nodes } = JSON.parse(jsonString) as {
    nodes: Nodes;
  };

  for (const key of Object.keys(nodes)) {
    if (nodes[key].dataServiceId === dataServiceId) {
      signerAddresses.push(nodes[key].evmAddress);
    }
  }

  return signerAddresses;
};

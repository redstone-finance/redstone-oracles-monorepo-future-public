import { fetchFromMonorepo } from "./monorepo-fetcher";

interface FetchedDataServices {
  [dataServiceId: string]: object;
}

export const getProdDataServices = async (): Promise<string[]> => {
  const path =
    "packages/oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json";

  const result: string[] = [];

  const jsonString = await fetchFromMonorepo(path);

  const { dataServices } = JSON.parse(jsonString) as {
    dataServices: FetchedDataServices;
  };

  for (const dataServiceId of Object.keys(dataServices)) {
    if (dataServiceId.includes("prod")) {
      result.push(dataServiceId);
    }
  }

  return result;
};

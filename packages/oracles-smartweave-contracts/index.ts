import { default as redstoneOraclesInitialState } from "./src/contracts/redstone-oracle-registry/initial-state.json";

export type DataServiceIds =
  keyof (typeof redstoneOraclesInitialState)["dataServices"];

export function getSignersForDataServiceId(dataServiceId: DataServiceIds) {
  const signers = Object.values(redstoneOraclesInitialState.nodes)
    .filter((node) => node.dataServiceId === dataServiceId)
    .map((node) => node.evmAddress);
  return signers.length > 0 ? signers : undefined;
}

export * from "./src/contracts/redstone-oracle-registry/types";
export { redstoneOraclesInitialState };

import {
  redstoneOraclesInitialState,
  RedstoneOraclesState,
} from "@redstone-finance/oracles-smartweave-contracts";

export const getOracleRegistryState =
  async (): Promise<RedstoneOraclesState> => {
    return await Promise.resolve(redstoneOraclesInitialState);
  };

export const getOracleRegistryStateSync = () => redstoneOraclesInitialState;

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

export const getSignersForDataServiceId = (
  oracleState: RedstoneOraclesState,
  dataServiceId: string
) =>
  Object.values(oracleState.nodes)
    .filter((node) => node.dataServiceId === dataServiceId)
    .map((node) => node.evmAddress);

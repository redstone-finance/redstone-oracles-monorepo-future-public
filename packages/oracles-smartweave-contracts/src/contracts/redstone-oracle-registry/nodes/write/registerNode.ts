import {
  RedstoneOraclesState,
  RedstoneOraclesAction,
  RegisterNodeInputData,
  ContractErrorType,
} from "../../types";

declare const ContractError: ContractErrorType;

export const registerNode = (
  state: RedstoneOraclesState,
  action: RedstoneOraclesAction
): { state: RedstoneOraclesState } => {
  const data = action.input.data as RegisterNodeInputData;
  const caller = action.caller;

  const isValidData =
    data.name &&
    data.logo &&
    data.description &&
    data.dataFeedId &&
    data.evmAddress &&
    data.ipAddress &&
    data.ecdsaPublicKey &&
    data.arweavePublicKey;

  if (!isValidData) {
    throw new ContractError("Invalid node data");
  }

  if (state.nodes[caller]) {
    throw new ContractError(`Node with owner ${caller} already exists`);
  }

  if (!state.dataFeeds[data.dataFeedId]) {
    throw new ContractError(
      `Data feed with id ${data.dataFeedId} does not exist`
    );
  }

  state.nodes[caller] = data;

  return { state };
};

import {
  RedstoneOraclesState,
  RedstoneOraclesAction,
  UpdateNodeDetailInputData,
  ContractErrorType,
} from "../../types";

declare const ContractError: ContractErrorType;

export const updateNodeDetails = (
  state: RedstoneOraclesState,
  action: RedstoneOraclesAction
): { state: RedstoneOraclesState } => {
  const data = action.input.data as UpdateNodeDetailInputData;
  const caller = action.caller;

  const currentNodeState = state.nodes[caller];

  if (!currentNodeState) {
    throw new ContractError(`Node with owner ${caller} not found`);
  }

  state.nodes[caller] = {
    ...currentNodeState,
    ...data,
  };

  return { state };
};

import {
  ContractErrorType,
  RedstoneOraclesAction,
  RedstoneOraclesState,
  UpdateNodeDetailInputData,
} from "../../types";

declare const ContractError: ContractErrorType;

export const updateNodeDetails = (
  state: RedstoneOraclesState,
  action: RedstoneOraclesAction
): { state: RedstoneOraclesState } => {
  const data = action.input.data as UpdateNodeDetailInputData;
  const caller = action.caller;

  const currentNodeState = state.nodes[caller];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!currentNodeState) {
    throw new ContractError(`Node with owner ${caller} not found`);
  }

  state.nodes[caller] = {
    ...currentNodeState,
    ...data,
  };

  return { state };
};

import { ContractErrorType, RedstoneOraclesState } from "../../types";

declare const ContractError: ContractErrorType;

export const removeNode = (
  state: RedstoneOraclesState,
  caller: string
): { state: RedstoneOraclesState } => {
  const currentNodeState = state.nodes[caller];

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!currentNodeState) {
    throw new ContractError(`Node with owner ${caller} not found`);
  }

  delete state.nodes[caller];

  return { state };
};

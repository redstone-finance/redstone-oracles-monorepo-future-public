import {
  RedstoneOraclesState,
  RedstoneOraclesAction,
  ContractErrorType,
  EvolveInputData,
} from "./types";

declare const ContractError: ContractErrorType;

export const evolve = (
  state: RedstoneOraclesState,
  action: RedstoneOraclesAction
): { state: RedstoneOraclesState } => {
  if (!state.canEvolve) {
    throw new ContractError("Contract cannot evolve");
  }

  if (!state.contractAdmins.some((admin) => admin === action.caller)) {
    throw new ContractError("Only the admin can evolve a contract");
  }

  const data = action.input.data as EvolveInputData;

  state.evolve = data.evolveTransactionId;

  return { state };
};

import {
  RedstoneOraclesState,
  RedstoneOraclesAction,
  UpdateDataServiceInputData,
  ContractErrorType,
} from "../../types";

declare const ContractError: ContractErrorType;

export const updateDataService = (
  state: RedstoneOraclesState,
  action: RedstoneOraclesAction
): { state: RedstoneOraclesState } => {
  const data = action.input.data as UpdateDataServiceInputData;
  const { id, update } = data;

  const currentDataServiceState = state.dataServices[id];
  if (!currentDataServiceState) {
    throw new ContractError(`Data feed with id ${id} not found`);
  }

  if (action.caller !== currentDataServiceState.admin) {
    throw new ContractError("Only admin can update data feed");
  }

  state.dataServices[id] = {
    ...currentDataServiceState,
    ...update,
  };

  return { state };
};

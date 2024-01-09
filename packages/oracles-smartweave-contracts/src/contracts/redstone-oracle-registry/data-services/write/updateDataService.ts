import {
  ContractErrorType,
  RedstoneOraclesAction,
  RedstoneOraclesState,
  UpdateDataServiceInputData,
} from "../../types";

declare const ContractError: ContractErrorType;

export const updateDataService = (
  state: RedstoneOraclesState,
  action: RedstoneOraclesAction
): { state: RedstoneOraclesState } => {
  const data = action.input.data as UpdateDataServiceInputData;
  const { id, update } = data;

  const currentDataServiceState = state.dataServices[id];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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

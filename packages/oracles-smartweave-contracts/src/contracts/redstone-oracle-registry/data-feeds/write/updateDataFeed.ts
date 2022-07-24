import {
  RedstoneOraclesState,
  RedstoneOraclesAction,
  UpdateDataFeedInputData,
  ContractErrorType,
} from "../../types";

declare const ContractError: ContractErrorType;

export const updateDataFeed = (
  state: RedstoneOraclesState,
  action: RedstoneOraclesAction
): { state: RedstoneOraclesState } => {
  const data = action.input.data as UpdateDataFeedInputData;
  const { id, update } = data;

  const currentDataFeedState = state.dataFeeds[id];
  if (!currentDataFeedState) {
    throw new ContractError(`Data feed with id ${id} not found`);
  }

  if (action.caller !== currentDataFeedState.admin) {
    throw new ContractError("Only admin can update data feed");
  }

  state.dataFeeds[id] = {
    ...currentDataFeedState,
    ...update,
  };

  return { state };
};

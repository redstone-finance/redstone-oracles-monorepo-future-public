import {
  ContractErrorType,
  RedstoneOraclesAction,
  RedstoneOraclesState,
  RegisterNodeInputData,
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
    data.dataServiceId &&
    data.evmAddress &&
    data.ipAddress &&
    data.ecdsaPublicKey;

  if (!isValidData) {
    throw new ContractError("Invalid node data");
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (state.nodes[caller]) {
    throw new ContractError(`Node with owner ${caller} already exists`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!state.dataServices[data.dataServiceId]) {
    throw new ContractError(
      `Data feed with id ${data.dataServiceId} does not exist`
    );
  }

  state.nodes[caller] = data;

  return { state };
};

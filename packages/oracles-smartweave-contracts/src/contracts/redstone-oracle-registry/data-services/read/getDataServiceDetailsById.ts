import { getDetailsById } from "../../common/getDetailsById";
import {
  RedstoneOraclesState,
  RedstoneOraclesInput,
  GetDataServiceDetailsByIdInputData,
  GetDataServiceDetailsByIdResult,
  ContractErrorType,
  DataServiceWithId,
} from "../../types";

declare const ContractError: ContractErrorType;

export const getDataServiceDetailsById = (
  state: RedstoneOraclesState,
  input: RedstoneOraclesInput
): GetDataServiceDetailsByIdResult => {
  const data = input.data as GetDataServiceDetailsByIdInputData;
  const dataServiceDetails = getDetailsById({
    identifier: data?.id,
    state,
    oraclesType: "dataServices",
  }) as DataServiceWithId;
  return { result: dataServiceDetails };
};

import { getDetailsById } from "../../common/getDetailsById";
import {
  RedstoneOraclesState,
  RedstoneOraclesInput,
  GetDataFeedDetailsByIdInputData,
  GetDataFeedDetailsByIdResult,
  ContractErrorType,
  DataFeedWithId,
} from "../../types";

declare const ContractError: ContractErrorType;

export const getDataFeedDetailsById = (
  state: RedstoneOraclesState,
  input: RedstoneOraclesInput
): GetDataFeedDetailsByIdResult => {
  const data = input.data as GetDataFeedDetailsByIdInputData;
  const dataFeedDetails = getDetailsById({
    identifier: data?.id,
    state,
    oraclesType: "dataFeeds",
  }) as DataFeedWithId;
  return { result: dataFeedDetails };
};

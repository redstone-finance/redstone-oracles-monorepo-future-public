import { getDetailsById } from "../../common/getDetailsById";
import {
  DataServiceWithId,
  GetDataServiceDetailsByIdInputData,
  GetDataServiceDetailsByIdResult,
  RedstoneOraclesInput,
  RedstoneOraclesState,
} from "../../types";

export const getDataServiceDetailsById = (
  state: RedstoneOraclesState,
  input: RedstoneOraclesInput
): GetDataServiceDetailsByIdResult => {
  const data = input.data as GetDataServiceDetailsByIdInputData;
  const dataServiceDetails = getDetailsById({
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    identifier: data?.id,
    state,
    oraclesType: "dataServices",
  }) as DataServiceWithId;
  return { result: dataServiceDetails };
};

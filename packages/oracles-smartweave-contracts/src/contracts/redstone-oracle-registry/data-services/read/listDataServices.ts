import { listWithPagination } from "../../common/listWithPagination";
import {
  RedstoneOraclesState,
  RedstoneOraclesInput,
  ListInputData,
  ListResult,
} from "../../types";

export const listDataServices = (
  state: RedstoneOraclesState,
  input: RedstoneOraclesInput
): ListResult => {
  const paginationData = input.data as ListInputData;
  const dataServicesArray = listWithPagination(
    paginationData,
    state.dataServices
  );
  return { result: dataServicesArray };
};

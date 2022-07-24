import { listWithPagination } from "../../common/listWithPagination";
import {
  RedstoneOraclesState,
  RedstoneOraclesInput,
  ListInputData,
  ListResult,
} from "../../types";

export const listDataFeeds = (
  state: RedstoneOraclesState,
  input: RedstoneOraclesInput
): ListResult => {
  const paginationData = input.data as ListInputData;
  const dataFeedsArray = listWithPagination(paginationData, state.dataFeeds);
  return { result: dataFeedsArray };
};

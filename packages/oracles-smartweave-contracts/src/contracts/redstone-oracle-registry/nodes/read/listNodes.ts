import { listWithPagination } from "../../common/listWithPagination";
import {
  RedstoneOraclesState,
  RedstoneOraclesInput,
  ListInputData,
  ListResult,
} from "../../types";

export const listNodes = (
  state: RedstoneOraclesState,
  input: RedstoneOraclesInput
): ListResult => {
  const paginationData = input.data as ListInputData;
  const nodesArray = listWithPagination(paginationData, state.nodes);
  return { result: nodesArray };
};

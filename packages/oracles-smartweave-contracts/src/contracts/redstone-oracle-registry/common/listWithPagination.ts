import { DataFeeds, ListInputData, Nodes } from "../types";

export const listWithPagination = (
  paginationData: ListInputData,
  oracles: DataFeeds | Nodes
) => {
  let oraclesArray = Object.keys(oracles);

  if (paginationData?.startAfter) {
    oraclesArray = oraclesArray.slice(paginationData.startAfter);
  }

  if (paginationData?.limit) {
    oraclesArray = oraclesArray.slice(0, paginationData.limit);
  }

  return oraclesArray;
};

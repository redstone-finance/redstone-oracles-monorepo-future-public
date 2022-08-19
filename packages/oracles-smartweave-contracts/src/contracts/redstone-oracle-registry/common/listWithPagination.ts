import { DataServices, ListInputData, Nodes } from "../types";

export const listWithPagination = (
  paginationData: ListInputData,
  oracles: DataServices | Nodes
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

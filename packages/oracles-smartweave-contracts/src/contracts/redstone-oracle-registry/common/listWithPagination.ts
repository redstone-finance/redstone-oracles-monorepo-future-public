import { DataServices, ListInputData, Nodes } from "../types";

export const listWithPagination = (
  paginationData: ListInputData,
  oracles: DataServices | Nodes
) => {
  let oraclesArray = Object.keys(oracles);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (paginationData?.startAfter) {
    oraclesArray = oraclesArray.slice(paginationData.startAfter);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (paginationData?.limit) {
    oraclesArray = oraclesArray.slice(0, paginationData.limit);
  }

  return oraclesArray;
};

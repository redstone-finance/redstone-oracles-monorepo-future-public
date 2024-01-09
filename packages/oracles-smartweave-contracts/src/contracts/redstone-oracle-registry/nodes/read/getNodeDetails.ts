import { getDetailsById } from "../../common/getDetailsById";
import {
  GetNodeDetailsInputData,
  GetNodesDetailsResult,
  NodeWithAddress,
  RedstoneOraclesInput,
  RedstoneOraclesState,
} from "../../types";

export const getNodeDetails = (
  state: RedstoneOraclesState,
  input: RedstoneOraclesInput
): GetNodesDetailsResult => {
  const data = input.data as GetNodeDetailsInputData;
  const nodesDetails = getDetailsById({
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    identifier: data?.address,
    state,
    oraclesType: "nodes",
  }) as NodeWithAddress;
  return { result: nodesDetails };
};

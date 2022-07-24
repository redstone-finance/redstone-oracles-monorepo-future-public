import { getDetailsById } from "../../common/getDetailsById";
import {
  RedstoneOraclesState,
  RedstoneOraclesInput,
  GetNodeDetailsInputData,
  GetNodesDetailsResult,
  NodeWithAddress,
} from "../../types";

export const getNodeDetails = (
  state: RedstoneOraclesState,
  input: RedstoneOraclesInput
): GetNodesDetailsResult => {
  const data = input.data as GetNodeDetailsInputData;
  const nodesDetails = getDetailsById({
    identifier: data?.address,
    state,
    oraclesType: "nodes",
  }) as NodeWithAddress;
  return { result: nodesDetails };
};

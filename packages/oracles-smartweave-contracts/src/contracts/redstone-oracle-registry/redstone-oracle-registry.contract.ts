import { getDataServiceDetailsById } from "./data-services/read/getDataServiceDetailsById";
import { listDataServices } from "./data-services/read/listDataServices";
import { createDataService } from "./data-services/write/createDataService";
import { updateDataService } from "./data-services/write/updateDataService";
import { evolve } from "./evolve";
import { getNodeDetails } from "./nodes/read/getNodeDetails";
import { listNodes } from "./nodes/read/listNodes";
import { registerNode } from "./nodes/write/registerNode";
import { removeNode } from "./nodes/write/removeNode";
import { updateNodeDetails } from "./nodes/write/updateNodeDetails";
import {
  ContractErrorType,
  ContractResult,
  RedstoneOraclesAction,
  RedstoneOraclesState,
} from "./types";

declare const ContractError: ContractErrorType;

export const handle = async (
  state: RedstoneOraclesState,
  action: RedstoneOraclesAction
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<ContractResult> => {
  const { input } = action;

  switch (input.function) {
    case "listNodes":
      return listNodes(state, input);
    case "getNodeDetails":
      return getNodeDetails(state, input);
    case "registerNode":
      return registerNode(state, action);
    case "updateNodeDetails":
      return updateNodeDetails(state, action);
    case "removeNode":
      return removeNode(state, action.caller);
    case "listDataServices":
      return listDataServices(state, input);
    case "getDataServiceDetailsById":
      return getDataServiceDetailsById(state, input);
    case "createDataService":
      return createDataService(state, action);
    case "updateDataService":
      return updateDataService(state, action);
    case "evolve":
      return evolve(state, action);
    default:
      throw new ContractError(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `No function supplied or function not recognized: "${input.function}"`
      );
  }
};

export interface EvolveState {
  canEvolve: boolean;
  evolve: string | null;
}

export interface RedstoneOraclesState extends EvolveState {
  contractAdmins: string[];
  nodes: Nodes;
  dataFeeds: DataFeeds;
}

export type Nodes = { [key in string]: Node };
export type DataFeeds = { [key in string]: DataFeed };

interface Node {
  name: string;
  logo: string;
  description: string;
  dataFeedId: string;
  evmAddress: string;
  ipAddress: string;
  ecdsaPublicKey: string;
  arweavePublicKey: string;
  url?: string;
}

interface DataFeed {
  name: string;
  manifestTxId: string;
  logo: string;
  description: string;
  admin: string;
}

export interface RedstoneOraclesAction {
  input: RedstoneOraclesInput;
  caller: string;
}

export interface RedstoneOraclesInput {
  function:
    | "listNodes"
    | "getNodeDetails"
    | "registerNode"
    | "updateNodeDetails"
    | "removeNode"
    | "listDataFeeds"
    | "getDataFeedDetailsById"
    | "createDataFeed"
    | "updateDataFeed"
    | "evolve";
  data:
    | ListInputData
    | GetNodeDetailsInputData
    | RegisterNodeInputData
    | UpdateNodeDetailInputData
    | GetDataFeedDetailsByIdInputData
    | CreateDataFeedInputData
    | UpdateDataFeedInputData
    | EvolveInputData;
}

export interface ListInputData {
  limit?: number;
  startAfter?: number;
}

export interface GetNodeDetailsInputData {
  address: string;
}

export type RegisterNodeInputData = Node;

export type UpdateNodeDetailInputData = Partial<Node>;

export interface ListResult {
  result: string[];
}

export interface GetNodesDetailsResult {
  result: NodeWithAddress;
}

export interface NodeWithAddress extends Node {
  address: string;
}

export type RedstoneOraclesContractResult =
  | ListResult
  | GetNodesDetailsResult
  | GetDataFeedDetailsByIdResult;

export interface GetDataFeedDetailsByIdInputData {
  id: string;
}

export interface CreateDataFeedInputData extends Omit<DataFeed, "admin"> {
  id: string;
}

export interface UpdateDataFeedInputData {
  id: string;
  update: Partial<DataFeed>;
}

export interface GetDataFeedDetailsByIdResult {
  result: DataFeedWithId;
}

export interface DataFeedWithId extends DataFeed {
  id: string;
}

export interface EvolveInputData {
  evolveTransactionId: string;
}

export type ContractResult =
  | { state: RedstoneOraclesState }
  | RedstoneOraclesContractResult;

export type ContractErrorType = new (message: string) => any;

export interface GetDetailsByIdInput {
  identifier: string;
  state: RedstoneOraclesState;
  oraclesType: "nodes" | "dataFeeds";
}

export interface EvolveState {
  canEvolve: boolean;
  evolve: string | null;
}

export interface RedstoneOraclesState extends EvolveState {
  contractAdmins: string[];
  nodes: Nodes;
  dataServices: DataServices;
}

export type Nodes = { [key in string]: Node };
export type DataServices = { [key in string]: DataService };

interface Node {
  name: string;
  logo: string;
  description: string;
  dataServiceId: string;
  evmAddress: string;
  ipAddress: string;
  ecdsaPublicKey: string;
  arweavePublicKey: string;
  url?: string;
}

interface DataService {
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
    | "listDataServices"
    | "getDataServiceDetailsById"
    | "createDataService"
    | "updateDataService"
    | "evolve";
  data:
    | ListInputData
    | GetNodeDetailsInputData
    | RegisterNodeInputData
    | UpdateNodeDetailInputData
    | GetDataServiceDetailsByIdInputData
    | CreateDataServiceInputData
    | UpdateDataServiceInputData
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
  | GetDataServiceDetailsByIdResult;

export interface GetDataServiceDetailsByIdInputData {
  id: string;
}

export interface CreateDataServiceInputData extends Omit<DataService, "admin"> {
  id: string;
}

export interface UpdateDataServiceInputData {
  id: string;
  update: Partial<DataService>;
}

export interface GetDataServiceDetailsByIdResult {
  result: DataServiceWithId;
}

export interface DataServiceWithId extends DataService {
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
  oraclesType: "nodes" | "dataServices";
}

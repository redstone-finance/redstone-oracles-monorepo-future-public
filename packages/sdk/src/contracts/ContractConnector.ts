export interface ContractConnector<Adapter> {
  getAdapter(): Promise<Adapter>;
  getBlockNumber(rpcUrl: string): Promise<number>;
}

export interface IContractConnector<Adapter> {
  getAdapter(): Promise<Adapter>;
  getBlockNumber(rpcUrl: string): Promise<number>;
}

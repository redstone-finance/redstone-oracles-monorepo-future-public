export interface IContractConnector<Adapter> {
  getAdapter(): Promise<Adapter>;

  getBlockNumber(): Promise<number>;

  waitForTransaction(txId: string): Promise<boolean>;
}

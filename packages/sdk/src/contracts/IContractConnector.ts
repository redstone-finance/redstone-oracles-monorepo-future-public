export interface IContractConnector<Adapter> {
  getAdapter(): Promise<Adapter>;

  getBlockNumber(): Promise<number>;

  waitForTransaction(txId: string): Promise<boolean>;

  /// Normalized to a number for which 1 XYZ means 1e18
  /// In some monitoring mechanisms we assume the currency is denominated to 10 ** 18 units
  getNormalizedBalance?: (
    address: string,
    blockNumber?: number
  ) => Promise<bigint>;
}

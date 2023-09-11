export type PriceManagerMetadata = {
  payload_timestamp: number;
  round?: number;
  block_number?: number;
  block_timestamp?: number;
};

export interface IPriceManagerContractAdapter {
  readTimestampAndRound(): Promise<PriceManagerMetadata>;

  writePrices(round: number): Promise<string>;
}

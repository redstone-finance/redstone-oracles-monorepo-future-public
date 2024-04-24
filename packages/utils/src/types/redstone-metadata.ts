// move to common packages when it will be merged ...
export type MetadataForRedstonePrice = {
  nodeLabel: string;

  /** Aggregated value represented as decimal with '.' decimal point separator */
  value: string;

  /** Metadata per source */
  sourceMetadata: Record<string, MetadataPerSource | undefined>;
};

export interface MetadataPerSource {
  /** Info about slippage. Defined only for sources which supports calculating slippage. */
  slippage?: SlippageData[];

  /** Defined only for sources which supports fetching liquidity. */
  liquidity?: string;

  /** Defined for all sources. If source failed value will be = "error"  */
  value?: string;

  /** Info about current bid, ask prices and volume. Defined only for sources that allow retrieval of this data */
  tradeInfo?: TradeData;
}

export interface SlippageData {
  slippageAsPercent: string;
  direction: TradeDirections;
  simulationValueInUsd: string;
}

export interface TradeData {
  bidPrice?: number;
  askPrice?: number;
  /** 24-hour trading volume in USD */
  volumeInUsd?: number;
}

export enum TradeDirection {
  BUY = "buy",
  SELL = "sell",
}
export type TradeDirections = `${TradeDirection}`;

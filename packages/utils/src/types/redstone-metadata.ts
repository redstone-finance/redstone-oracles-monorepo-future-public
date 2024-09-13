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

  /** Source depth only calculated if depth median aggregator is used. */
  depth?: DepthData[];

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

export interface DepthData {
  percentage: number;
  direction: TradeDirections;
  valueInUsd: number;
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

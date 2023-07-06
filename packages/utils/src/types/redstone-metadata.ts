// move to common packages when it will be merged ...
export interface MetadataForRedstonePrice {
  /** Aggregated value represented as decimal with '.' decimal point separator */
  value: string;

  /** Metadata per source */
  sourceMetadata: Record<string, MetadataPerSource>;
}

export interface MetadataPerSource {
  /** Info about slippage. Defined only for sources which supports calculating slippage. */
  slippage?: SlippageInfo;

  /** Defined only for sources which supports fetching liquidity. */
  liquidity?: string;

  /** Defined for all sources. If source failed value will be = "error"  */
  value?: string | "error";
}

export interface SlippageInfo {
  slippageAsPercent: string;
  direction: "buy" | "sell";
  simulationValueInUsd: string;
}

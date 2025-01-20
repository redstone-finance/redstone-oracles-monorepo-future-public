export type PriceAdapterConfig = {
  signers: string[];
  signerCountThreshold: number;
  maxTimestampDelayMs: number;
  maxTimestampAheadMs: number;
  trustedUpdaters: string[];
  minIntervalBetweenUpdatesMs: number;
  initializeTxGasBudget: bigint;
};

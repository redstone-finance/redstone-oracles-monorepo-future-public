import * as anchor from "@coral-xyz/anchor";

export interface ConfigAccount {
  owner: anchor.web3.PublicKey;
  signerCountThreshold: number;
  signers: number[][];
  trustedUpdaters: anchor.web3.PublicKey[];
  maxTimestampDelayMs: anchor.BN;
  maxTimestampAheadMs: anchor.BN;
  minIntervalBetweenUpdatesMs: anchor.BN;
}

export interface PriceData {
  feedId: number[];
  value: number[];
  timestamp: anchor.BN;
  writeTimestamp: anchor.BN | null;
}

import * as anchor from "@coral-xyz/anchor";

export interface PriceData {
  feedId: number[];
  value: number[];
  timestamp: anchor.BN;
  writeTimestamp: anchor.BN | null;
}

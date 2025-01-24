import { z } from "zod";

export const SuiNetworkSchema = z.enum([
  "mainnet",
  "testnet",
  "localnet",
  "devnet",
]);
export type SuiNetworkName = z.infer<typeof SuiNetworkSchema>;

export interface SuiConfig {
  packageId: string;
  priceAdapterObjectId: string;
  writePricesTxGasBudget?: bigint;
}

import { z } from "zod";

export const SuiNetworkSchema = z.enum(["mainnet", "testnet", "localnet"]);
export type SuiNetworkName = z.infer<typeof SuiNetworkSchema>;

export interface SuiConfig {
  network: SuiNetworkName;
  packageId: string;
  priceAdapterObjectId: string;
  writePricesTxGasBudget?: bigint;
}

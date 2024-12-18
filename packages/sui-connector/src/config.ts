import { z } from "zod";

export const NetworkEnum = z.enum(["mainnet", "testnet", "localnet"]);
export type Network = z.infer<typeof NetworkEnum>;

export const SuiConfigSchema = z.object({
  network: NetworkEnum,
  packageId: z.string(),
  priceAdapterObjectId: z.string(),
  writePricesTxGasBudget: z.number().default(100000000),
});

export type SuiConfig = z.infer<typeof SuiConfigSchema>;

export const SuiDeployConfigSchema = z.object({
  network: NetworkEnum,
  uniqueSignerCount: z.number(),
  signers: z.array(z.string()),
  signerCountThreshold: z.number(),
  maxTimestampDelayMs: z.number(),
  maxTimestampAheadMs: z.number(),
  initializeTxGasBudget: z.number().default(100000000),
});

export type SuiDeployConfig = z.infer<typeof SuiDeployConfigSchema>;

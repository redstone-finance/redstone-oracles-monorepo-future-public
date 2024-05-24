import { z } from "zod";
import config from "./chains-configs.json";

export const ChainConfigSchema = z.object({
  chainId: z.number().positive(),
  name: z.string(),
  publicRpcUrls: z.string().url().array(),
  avgBlockTimeMs: z.number(),
  isAuctionModel: z.boolean(),
  twoDimensionalFees: z.boolean(),
  multicall3: z
    .object({
      address: z.string(),
      type: z.literal("Multicall3"),
    })
    .or(
      z.object({
        address: z.string(),
        type: z.literal("RedstoneMulticall3"),
        gasLimitPerCall: z.number().positive(),
      })
    ),
});

export type ChainConfig = z.infer<typeof ChainConfigSchema>;
export type SupportedNetworkNames = keyof typeof ChainConfigs;

export const STANDARD_MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11";
export const REDSTONE_MULTICALL3_ADDRESS =
  "0xad6cc5a465e5c8284a49ec9ed10efe275460678c";

export const ChainConfigs = z.record(ChainConfigSchema).parse(config);

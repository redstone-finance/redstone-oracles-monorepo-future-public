import { z } from "zod";
import config from "./chains-configs.json";

export const ChainConfigSchema = z.object({
  chainId: z.number().positive(),
  name: z.string(),
  publicRpcUrls: z.string().url().array(),
  avgBlockTimeMs: z.number(),
  isAuctionModel: z.boolean(),
  twoDimensionalFees: z.boolean(),
  etherScanApi: z.string().url().optional(),
  /**
   * Some blockchains don't have empty blocks, thus eth_feeHistory returns 0, but they have
   * minimal maxPriorityFeePerGas requirement.
   * In such a case we can use eth_maxPriorityFeePerGas rpc call to obtain this minimal value.
   * Be aware that some of the chains accepts 0 as tip if blocks are empty or don't use tips at all and always returns 0 from eth_feeHistory - in such a cases this value should be left to default
   */
  fallbackToEthMaxPriorityFeePerGas: z.boolean().default(false),
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
    )
    .or(
      z.object({
        address: z.string(),
        type: z.literal("zkSyncMulticall3"),
      })
    )
    .or(
      z.object({
        address: z.string(),
        type: z.literal("zkLinkMulticall3"),
      })
    ),
});

export type ChainConfig = z.infer<typeof ChainConfigSchema>;
export type SupportedNetworkNames = keyof typeof config;

export const STANDARD_MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11";
export const REDSTONE_MULTICALL3_ADDRESS =
  "0xaD6CC5a465E5c8284a49eC9eD10EFE275460678c";
export const ZKSYNC_MULTICALL3_ADDRESS =
  "0xF9cda624FBC7e059355ce98a31693d299FACd963";
export const ZKLINK_MULTICALL3_ADDRESS =
  "0x825267E0fA5CAe92F98540828a54198dcB3Eaeb5";

export const ChainConfigs = z.record(ChainConfigSchema).parse(config);

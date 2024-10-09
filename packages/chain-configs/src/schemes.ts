import { z } from "zod";
import chainConfigs from "../manifest/chain-configs.json";

export const ChainConfigSchema = z.object({
  chainId: z.number().positive(),
  name: z.string(),
  publicRpcUrls: z.string().url().array(),
  avgBlockTimeMs: z.number(),
  isAuctionModel: z.boolean(),
  twoDimensionalFees: z.boolean(),
  isMainnet: z.boolean(),
  disabled: z.boolean().default(false),
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
    ),
});

export const ChainConfigsSchema = z.record(z.string(), ChainConfigSchema);
export const ChainConfigsByIdSchema = z.record(z.number(), ChainConfigSchema);

export type ChainConfig = z.infer<typeof ChainConfigSchema>;
export type ChainConfigs = z.infer<typeof ChainConfigsSchema>;
export type ChainConfigsById = z.infer<typeof ChainConfigsByIdSchema>;
export type SupportedNetworkNames = keyof typeof chainConfigs.defaultConfig;

export const STANDARD_MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11";
export const REDSTONE_MULTICALL3_ADDRESS =
  "0xaD6CC5a465E5c8284a49eC9eD10EFE275460678c";

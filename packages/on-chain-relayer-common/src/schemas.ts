import { z } from "zod";

export const PRICE_FEEDS = "price-feeds";
export const MENTO = "mento";
export const MULTI_FEED = "multi-feed";
export const FUEL = "fuel";
export const RADIX = "radix";
export const RADIX_MULTI_FEED = `${RADIX}-${MULTI_FEED}`;
export const SUI_MULTI_FEED = `sui-${MULTI_FEED}`;

export const MultiFeedAdapterTypesEnum = z.enum([
  MULTI_FEED,
  RADIX_MULTI_FEED,
  SUI_MULTI_FEED,
]);
export const NonEvmAdapterTypesEnum = z.enum([
  FUEL,
  RADIX,
  RADIX_MULTI_FEED,
  SUI_MULTI_FEED,
]);
export const BaseAdapterTypesEnum = z.enum([
  PRICE_FEEDS,
  MENTO,
  ...NonEvmAdapterTypesEnum.options,
]);
export const AdapterTypesEnum = z.enum([
  ...BaseAdapterTypesEnum.options,
  ...MultiFeedAdapterTypesEnum.options,
  ...NonEvmAdapterTypesEnum.options,
]);
export type AdapterType = z.infer<typeof AdapterTypesEnum>;
export type NonEvmAdapterType = z.infer<typeof NonEvmAdapterTypesEnum>;

export const ChainSchema = z.object({
  name: z.string(),
  id: z.number(),
});

export const UpdateTriggersSchema = z.object({
  cron: z.array(z.string()).optional(),
  deviationPercentage: z.number().optional(),
  timeSinceLastUpdateInMilliseconds: z.number().optional(),
  priceFeedsDeviationOverrides: z.record(z.string(), z.number()).optional(),
});

export type UpdateTriggers = z.infer<typeof UpdateTriggersSchema>;

const PriceFeedConfigSchema = z.object({
  updateTriggersOverrides: UpdateTriggersSchema.optional(),
  priceFeedAddress: z.string().optional(),
});

export const CommonManifestSchema = z.object({
  chain: ChainSchema,
  updateTriggers: UpdateTriggersSchema,
  adapterContract: z.string(),
  adapterContractPackageId: z.string().optional(),
  adapterContractType: AdapterTypesEnum,
  dataServiceId: z.string(),
  priceFeeds: z.record(z.string(), z.any()),
  dataPacakgesNames: z.array(z.string()).optional(),
});

export const OnChainRelayerManifestSchema = CommonManifestSchema.extend({
  adapterContractType: BaseAdapterTypesEnum.default(PRICE_FEEDS),
  priceFeeds: z.record(z.string(), z.string()),
});

export const MultiFeedOnChainRelayerManifestSchema =
  CommonManifestSchema.extend({
    adapterContractType: MultiFeedAdapterTypesEnum.default(MULTI_FEED),
    priceFeeds: z.record(z.string(), PriceFeedConfigSchema),
  });

export const AnyOnChainRelayerManifestSchema = z.union([
  OnChainRelayerManifestSchema,
  MultiFeedOnChainRelayerManifestSchema,
]);

export type PriceFeedConfig = z.infer<typeof PriceFeedConfigSchema>;

export type MultiFeedOnChainRelayerManifest = z.infer<
  typeof MultiFeedOnChainRelayerManifestSchema
>;

export type MultiFeedOnChainRelayerManifestInput = z.input<
  typeof MultiFeedOnChainRelayerManifestSchema
>;

export type OnChainRelayerManifest = z.infer<
  typeof OnChainRelayerManifestSchema
>;

export type OnChainRelayerManifestInput = z.input<
  typeof OnChainRelayerManifestSchema
>;

export type CommonRelayerManifest = z.infer<typeof CommonManifestSchema>;

export type AnyOnChainRelayerManifest = z.infer<
  typeof AnyOnChainRelayerManifestSchema
>;

export type AnyOnChainRelayerManifestInput = z.input<
  typeof AnyOnChainRelayerManifestSchema
>;

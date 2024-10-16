import { z } from "zod";

const PRICE_FEEDS = "price-feeds";
const MENTO = "mento";
const MULTI_FEED = "multi-feed";
const FUEL = "fuel";

export const BaseAdapterTypesEnum = z.enum([PRICE_FEEDS, MENTO, FUEL]);
export const MultiFeedAdapterTypesEnum = z.enum([MULTI_FEED]);
export const AdapterTypesEnum = z.enum([
  ...BaseAdapterTypesEnum.options,
  ...MultiFeedAdapterTypesEnum.options,
]);
export type AdapterType = z.infer<typeof AdapterTypesEnum>;

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

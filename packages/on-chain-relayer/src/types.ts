import {
  DataPackagesResponse,
  ValuesForDataFeeds,
} from "@redstone-finance/sdk";
import { z } from "zod";
import { LastRoundTimestamps } from "./core/contract-interactions/get-last-round-params";

export interface Context {
  dataPackages: DataPackagesResponse;
  valuesFromContract: ValuesForDataFeeds;
  lastUpdateTimestamps: LastRoundTimestamps;
  uniqueSignersThreshold: number;
}

export interface ConditionCheckResponse {
  shouldUpdatePrices: boolean;
  warningMessage: string;
}

const PRICE_FEEDS = "price-feeds";
const MENTO = "mento";
const MULTI_FEED = "multi-feed";
export const BaseAdapterTypesEnum = z.enum([PRICE_FEEDS, MENTO]);
export const MultiFeedAdapterTypesEnum = z.enum([MULTI_FEED]);
export const AdapterTypesEnum = z.enum([
  ...BaseAdapterTypesEnum.options,
  ...MultiFeedAdapterTypesEnum.options,
]);

export type AdapterType = z.infer<typeof AdapterTypesEnum>;

export const UpdateTriggersSchema = z.object({
  cron: z.array(z.string()).optional(),
  deviationPercentage: z.number().optional(),
  timeSinceLastUpdateInMilliseconds: z.number().optional(),
  priceFeedsDeviationOverrides: z.record(z.string(), z.number()).optional(),
});

export const ChainSchema = z.object({
  name: z.string(),
  id: z.number(),
});

const PriceFeedConfigSchema = z.object({
  updateTriggersOverrides: UpdateTriggersSchema.optional(),
  priceFeedAddress: z.string().optional(),
});

const CommonManifestSchema = {
  chain: ChainSchema,
  updateTriggers: UpdateTriggersSchema,
  adapterContract: z.string(),
  dataServiceId: z.string(),
  dataPacakgesNames: z.array(z.string()).optional(),
};

export const OnChainRelayerManifestSchema = z.object({
  ...CommonManifestSchema,
  adapterContractType: BaseAdapterTypesEnum.default(PRICE_FEEDS),
  priceFeeds: z.record(z.string(), z.string()),
});

export const MultiFeedOnChainRelayerManifestSchema = z.object({
  ...CommonManifestSchema,
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

export type UpdateTriggers = z.infer<typeof UpdateTriggersSchema>;

export type OnChainRelayerManifest = z.infer<
  typeof OnChainRelayerManifestSchema
>;

export type OnChainRelayerManifestInput = z.input<
  typeof OnChainRelayerManifestSchema
>;

export type AnyOnChainRelayerManifest = z.infer<
  typeof AnyOnChainRelayerManifestSchema
>;

export type AnyOnChainRelayerManifestInput = z.input<
  typeof AnyOnChainRelayerManifestSchema
>;

export interface RelayerConfig {
  relayerIterationInterval: number;
  updatePriceInterval?: number;
  cronExpressions?: string[];
  rpcUrls: string[];
  chainName: string;
  chainId: number;
  privateKey: string;
  adapterContractAddress: string;
  dataServiceId: string;
  dataFeeds: string[];
  dataPackagesNames?: string[];
  gasLimit?: number;
  gasMultiplier?: number;
  maxTxSendAttempts?: number;
  updateConditions: ConditionCheckNames[];
  minDeviationPercentage?: number;
  healthcheckPingUrl?: string;
  adapterContractType: AdapterType;
  expectedTxDeliveryTimeInMS: number;
  twoDimensionalFees: boolean;
  fallbackOffsetInMinutes?: number;
  fallbackOffsetInMS: number;
  cacheServiceUrls?: string[];
  isAuctionModel?: boolean;
  historicalPackagesGateways?: string[];
  mentoMaxDeviationAllowed?: number;
  singleProviderOperationTimeout: number;
  allProvidersOperationTimeout: number;
  isNotLazy: boolean;
  fallbackSkipDeviationBasedFrequentUpdates: boolean;
  disableCustomGasOracle: boolean;
  temporaryUpdatePriceInterval: number;
  priceFeedsDeviationOverrides?: Record<string, number>;
  getBlockNumberTimeout?: number;
  useMulticallProvider: boolean;
}

export type OnChainRelayerEnv = {
  relayerIterationInterval: number;
  rpcUrls: string[];
  privateKey: string;
  gasLimit?: number;
  healthcheckPingUrl?: string;
  expectedTxDeliveryTimeInMS: number;
  twoDimensionalFees: boolean;
  fallbackOffsetInMinutes: number;
  cacheServiceUrls?: string[];
  historicalPackagesGateways?: string[];
  gasMultiplier?: number;
  maxTxSendAttempts?: number;
  isAuctionModel?: boolean;
  mentoMaxDeviationAllowed?: number;
  singleProviderOperationTimeout: number;
  allProvidersOperationTimeout: number;
  isNotLazy: boolean;
  fallbackSkipDeviationBasedFrequentUpdates: boolean;
  disableCustomGasOracle: boolean;
  temporaryUpdatePriceInterval: number;
  getBlockNumberTimeout?: number;
  useMulticallProvider: boolean;
};

export type ConfigProvider = () => RelayerConfig;

export type ConditionCheckNames = "time" | "value-deviation" | "cron";

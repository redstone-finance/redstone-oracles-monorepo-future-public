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

const PRICE_FEEDS = "price-feeds" as const;
const MENTO = "mento" as const;
const AdapterTypesEnum = z.enum([PRICE_FEEDS, MENTO]);
type AdapterType = z.infer<typeof AdapterTypesEnum>;

export const UpdateTriggersSchema = z.object({
  cron: z.array(z.string()).optional(),
  deviationPercentage: z.number().optional(),
  timeSinceLastUpdateInMilliseconds: z.number().optional(),
});

export const OnChainRelayerManifestSchema = z.object({
  chain: z.object({
    name: z.string(),
    id: z.number(),
  }),
  updateTriggers: UpdateTriggersSchema,
  adapterContract: z.string(),
  adapterContractType: AdapterTypesEnum.default(PRICE_FEEDS).optional(),
  dataServiceId: z.string(),
  priceFeeds: z.record(z.string(), z.string()),
});

export type UpdateTriggers = z.infer<typeof UpdateTriggersSchema>;

export type OnChainRelayerManifest = z.infer<
  typeof OnChainRelayerManifestSchema
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
  gasLimit: number;
  gasMultiplier: number;
  updateConditions: ConditionCheckNames[];
  minDeviationPercentage?: number;
  healthcheckPingUrl?: string;
  adapterContractType: AdapterType;
  expectedTxDeliveryTimeInMS: number;
  isArbitrumNetwork: boolean;
  fallbackOffsetInMinutes?: number;
  fallbackOffsetInMS: number;
  cacheServiceUrls?: string[];
  isAuctionModel?: boolean;
  historicalPackagesGateways?: string[];
  mentoMaxDeviationAllowed?: number;
  singleProviderOperationTimeout: number;
  allProvidersOperationTimeout: number;
  agreementAcceptableBlocksDiff: number;
  isNotLazy: boolean;
}

export type OnChainRelayerEnv = {
  relayerIterationInterval: number;
  rpcUrls: string[];
  privateKey: string;
  gasLimit: number;
  healthcheckPingUrl?: string;
  expectedTxDeliveryTimeInMS: number;
  isArbitrumNetwork: boolean;
  fallbackOffsetInMinutes: number;
  cacheServiceUrls?: string[];
  historicalPackagesGateways?: string[];
  gasMultiplier: number;
  isAuctionModel?: boolean;
  mentoMaxDeviationAllowed?: number;
  singleProviderOperationTimeout: number;
  allProvidersOperationTimeout: number;
  agreementAcceptableBlocksDiff: number;
  isNotLazy: boolean;
};

export type ConfigProvider = () => RelayerConfig;

export type ConditionCheckNames = "time" | "value-deviation" | "cron";

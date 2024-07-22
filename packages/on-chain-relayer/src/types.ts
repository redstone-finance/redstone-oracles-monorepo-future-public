import { DataPackagesResponse } from "@redstone-finance/sdk";
import { BigNumber, Contract } from "ethers";
import { z } from "zod";
import { MultiFeedAdapterWithoutRounds } from "../typechain-types";

export type LastRoundDetails = {
  lastDataPackageTimestampMS: number;
  lastBlockTimestampMS: number;
  lastValue: BigNumber;
};

export type ContractData = {
  [dataFeedsId: string]: LastRoundDetails;
};

export interface Context {
  dataPackages: DataPackagesResponse;
  dataFromContract: ContractData;
  uniqueSignersThreshold: number;
}

export interface ShouldUpdateResponse {
  dataFeedsToUpdate: string[];
  dataFeedsDeviationRatios: Record<string, number>;
  heartbeatUpdates: number[];
  warningMessage: string;
}

export interface ConditionCheckResponse {
  shouldUpdatePrices: boolean;
  warningMessage: string;
  maxDeviationRatio?: number;
}

export type IterationArgs<T extends Contract> = {
  shouldUpdatePrices: boolean;
  args: UpdatePricesArgs<T>;
  message?: string;
};

export type UpdatePricesArgsBase<T extends Contract = Contract> = {
  adapterContract: T;
  blockTag: number;
  fetchDataPackages: () => Promise<DataPackagesResponse>;
};

export type UpdatePricesMultiFeedFields = {
  dataFeedsToUpdate: string[];
  dataFeedsDeviationRatios: Record<string, number>;
  heartbeatUpdates: number[];
};

export type UpdatePricesArgs<T extends Contract = Contract> =
  UpdatePricesArgsBase<T> &
    (T extends MultiFeedAdapterWithoutRounds
      ? UpdatePricesMultiFeedFields
      : object);

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

export const CommonManifestSchema = z.object({
  chain: ChainSchema,
  updateTriggers: UpdateTriggersSchema,
  adapterContract: z.string(),
  dataServiceId: z.string(),
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

export type UpdateTriggers = z.infer<typeof UpdateTriggersSchema>;

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

export interface RelayerConfig {
  relayerIterationInterval: number;
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
  updateTriggers: Record<string, UpdateTriggers>;
  updateConditions: Record<string, ConditionCheckNames[]>;
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
  getBlockNumberTimeout?: number;
  useMulticallProvider: boolean;
  multiFeedAdditionalUpdatesDeviationThreshold?: number;
  multiFeedSyncHeartbeats?: boolean;
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
  multiFeedAdditionalUpdatesDeviationThreshold?: number;
  multiFeedSyncHeartbeats?: boolean;
};

export type ConfigProvider = () => RelayerConfig;

export type ConditionCheckNames = "time" | "value-deviation" | "cron";

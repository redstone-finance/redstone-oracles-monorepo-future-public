import {
  AdapterType,
  UpdateTriggers,
} from "@redstone-finance/on-chain-relayer-common";
import {
  DataPackagesRequestParams,
  DataPackagesResponse,
} from "@redstone-finance/sdk";
import { BigNumber } from "ethers";

export type LastRoundDetails = {
  lastDataPackageTimestampMS: number;
  lastBlockTimestampMS: number;
  lastValue: BigNumber;
};

export type ContractData = {
  [dataFeedsId: string]: LastRoundDetails;
};

export interface ShouldUpdateContext {
  dataPackages: DataPackagesResponse;
  dataFromContract: ContractData;
  uniqueSignersThreshold: number;
  blockTag: number;
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

export type IterationArgs = {
  shouldUpdatePrices: boolean;
  args: UpdatePricesArgs;
  message?: string;
};

export type UpdatePricesArgs = {
  blockTag: number;
  updateRequestParams: DataPackagesRequestParams;
  dataFeedsToUpdate: string[];
  fetchDataPackages: () => Promise<DataPackagesResponse>;
};

export type MultiFeedUpdatePricesArgs = UpdatePricesArgs & {
  dataFeedsDeviationRatios: Record<string, number>;
  heartbeatUpdates: number[];
};

export type RelayerConfig = OnChainRelayerEnv & ManifestConfig;

export type ManifestConfig = {
  chainName: string;
  chainId: number;
  adapterContractAddress: string;
  dataServiceId: string;
  dataFeeds: string[];
  dataPackagesNames?: string[];
  updateTriggers: Record<string, UpdateTriggers>;
  updateConditions: Record<string, ConditionCheckNames[]>;
  adapterContractType: AdapterType;
};

export type OnChainRelayerEnv = {
  relayerIterationInterval: number;
  rpcUrls: string[];
  privateKey: string;
  gasLimit?: number;
  healthcheckPingUrl?: string;
  expectedTxDeliveryTimeInMS: number;
  twoDimensionalFees: boolean;
  fallbackOffsetInMilliseconds: number;
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
  oevAuctionUrl?: string;
  oevResolveAuctionTimeout: number;
  oevTotalTimeout: number;
  oevVerifyGasPriceDisabled: boolean;
  enableEnhancedRequestDataPackagesLogs?: boolean;
  waitForAllGatewaysTimeMs?: number;
  dryRunWithInflux?: boolean;
  influxUrl?: string;
  influxToken?: string;
  runWithMqtt?: boolean;
  mqttEndpoint?: string;
  mqttUpdateSubscriptionIntervalMs?: number;
  mqttMinimalOffChainSignersCount?: number;
  mqttWaitForOtherSignersMs?: number;
  mqttFallbackMaxDelayBetweenPublishesMs?: number;
  mqttFallbackCheckIntervalMs?: number;
};

export type ConfigProvider = () => RelayerConfig;

export type ConditionCheckNames = "time" | "value-deviation" | "cron";

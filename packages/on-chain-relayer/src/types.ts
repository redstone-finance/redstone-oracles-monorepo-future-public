import {
  AdapterType,
  UpdateTriggers,
} from "@redstone-finance/on-chain-relayer-common";
import { DataPackagesResponse } from "@redstone-finance/sdk";
import { BigNumber } from "ethers";

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

export type IterationArgs = {
  shouldUpdatePrices: boolean;
  args: UpdatePricesArgs;
  message?: string;
};

export type UpdatePricesArgs = {
  blockTag: number;
  fetchDataPackages: () => Promise<DataPackagesResponse>;
};

export type MultiFeedUpdatePricesArgs = UpdatePricesArgs & {
  dataFeedsToUpdate: string[];
  dataFeedsDeviationRatios: Record<string, number>;
  heartbeatUpdates: number[];
};

export type RelayerConfig = OnChainRelayerEnv &
  ManifestConfig & { fallbackOffsetInMS: number };

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

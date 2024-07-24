import { DataPackagesResponse } from "@redstone-finance/sdk";
import { BigNumber, Contract } from "ethers";
import { MultiFeedAdapterWithoutRounds } from "../typechain-types";
import { AdapterType, UpdateTriggers } from "./schemas";

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

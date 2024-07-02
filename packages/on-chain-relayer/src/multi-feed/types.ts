import { DataPackagesResponse } from "@redstone-finance/sdk";
import { AdapterType, ConditionCheckNames, UpdateTriggers } from "../types";
import { ContractData } from "./args/fetch-data-from-contract";

export interface Context {
  dataPackages: DataPackagesResponse;
  dataFromContract: ContractData;
  uniqueSignersThreshold: number;
}

export interface ShouldUpdateResponse {
  dataFeedsToUpdate: string[];
  warningMessage: string;
}

export interface RelayerConfig {
  relayerIterationInterval: number;
  rpcUrls: string[];
  chainName: string;
  chainId: number;
  privateKey: string;
  adapterContractAddress: string;
  dataServiceId: string;
  dataFeeds: string[];
  updateTriggers: Record<string, UpdateTriggers>;
  dataPackagesNames?: string[];
  gasLimit?: number;
  gasMultiplier?: number;
  maxTxSendAttempts?: number;
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
  getBlockNumberTimeout?: number;
  useMulticallProvider: boolean;
}

export type ConfigProvider = () => RelayerConfig;

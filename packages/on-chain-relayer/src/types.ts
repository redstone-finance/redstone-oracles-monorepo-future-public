import { DataPackagesResponse, ValuesForDataFeeds } from "redstone-sdk";
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

export interface OnChainRelayerManifest {
  chain: {
    name: string;
    id: number;
  };
  updateTriggers: {
    cron?: string;
    deviationPercentage?: number;
    timeSinceLastUpdateInMilliseconds?: number;
  };
  adapterContract: string;
  adapterContractType?: string;
  dataServiceId: string;
  priceFeeds: {
    [dataFeedId: string]: string /* PriceFeed contract address */;
  };
}

export interface RelayerConfig {
  relayerIterationInterval: number;
  updatePriceInterval?: number;
  cronExpression?: string;
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
  adapterContractType: string;
  expectedTxDeliveryTimeInMS: number;
  isArbitrumNetwork: boolean;
  fallbackOffsetInMinutes: number;
  fallbackOffsetInMS: number;
  cacheServiceUrls?: string[];
  historicalPackagesGateways?: string[];
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
};

export type ConfigProvider = () => RelayerConfig;

export type ConditionCheckNames = "time" | "value-deviation" | "cron";

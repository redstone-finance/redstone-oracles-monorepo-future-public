import { DataPackagesResponse, ValuesForDataFeeds } from "redstone-sdk";

export interface Context {
  dataPackages: DataPackagesResponse;
  valuesFromContract: ValuesForDataFeeds;
  lastUpdateTimestamp: number;
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
  rpcUrl: string;
  chainName: string;
  chainId: number;
  privateKey: string;
  adapterContractAddress: string;
  dataServiceId: string;
  dataFeeds: string[];
  gasLimit: number;
  updateConditions: ConditionCheckNames[];
  minDeviationPercentage?: number;
  healthcheckPingUrl?: string;
  adapterContractType: string;
  expectedTxDeliveryTimeInMS: number;
  isArbitrumNetwork: boolean;
  fallbackOffsetInMinutes?: number;
  historicalPackagesGateway?: string;
}

export type OnChainRelayerEnv = {
  relayerIterationInterval: number;
  rpcUrl: string;
  privateKey: string;
  gasLimit: number;
  healthcheckPingUrl?: string;
  expectedTxDeliveryTimeInMS: number;
  isArbitrumNetwork: boolean;
  fallbackOffsetInMinutes: number;
  historicalPackagesGateway?: string;
};

export type ConfigProvider = () => RelayerConfig;

export type ConditionCheckNames = "time" | "value-deviation";

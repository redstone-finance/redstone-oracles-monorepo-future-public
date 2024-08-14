export type TransactionStats = {
  avgInterval?: number;
  mean: number;
  median: number;
  stdDev: number;
};

export interface IWalletsToMonitorConfig {
  address: string;
  minBalance: string;
  skipCheckingTransactions: boolean;
}

export interface ICommonRelayerManifest {
  chain: {
    id: number;
  };
  adapterContract: string;
}

export enum UpdaterType {
  main = "main",
  fallback = "fallback",
  manual = "manual",
}

export const updaterTypes = Object.values(UpdaterType);

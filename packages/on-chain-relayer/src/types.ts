import { DataPackagesResponse } from "redstone-sdk";

export interface ValuesForDataFeeds {
  [dataFeedId: string]: number;
}

export interface Context {
  dataPackages: DataPackagesResponse;
  valuesFromContract: ValuesForDataFeeds;
  lastUpdateTimestamp: number;
}

export interface ConditionCheckResponse {
  shouldUpdatePrices: boolean;
  warningMessage: string;
}

export type ConditionChecksNames = "time" | "value-deviation";

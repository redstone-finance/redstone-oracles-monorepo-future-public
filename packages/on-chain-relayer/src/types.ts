import {
  DataPackagesRequestParams,
  DataPackagesResponse,
  ContractData as SdkContractData,
  LastRoundDetails as SdkLastRoundDetails,
} from "@redstone-finance/sdk";

export type LastRoundDetails = SdkLastRoundDetails;
export type ContractData = SdkContractData;

export interface ShouldUpdateContext {
  dataPackages: DataPackagesResponse;
  dataFromContract: ContractData;
  uniqueSignersThreshold: number;
  blockTag: number;
}

export type IterationArgsMessage = { message: string; args?: unknown[] };

export interface ShouldUpdateResponse {
  dataFeedsToUpdate: string[];
  dataFeedsDeviationRatios: Record<string, number>;
  heartbeatUpdates: number[];
  messages: IterationArgsMessage[];
}

export interface ConditionCheckResponse {
  shouldUpdatePrices: boolean;
  messages: IterationArgsMessage[];
  maxDeviationRatio?: number;
}

export type IterationArgs = {
  shouldUpdatePrices: boolean;
  args: UpdatePricesArgs;
  messages: IterationArgsMessage[];
  additionalUpdateMessages?: IterationArgsMessage[];
};

export type UpdatePricesArgs = {
  blockTag: number;
  updateRequestParams: DataPackagesRequestParams;
  dataFeedsToUpdate: string[];
};

export type MultiFeedUpdatePricesArgs = UpdatePricesArgs & {
  dataFeedsDeviationRatios: Record<string, number>;
  heartbeatUpdates: number[];
};

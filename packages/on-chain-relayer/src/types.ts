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

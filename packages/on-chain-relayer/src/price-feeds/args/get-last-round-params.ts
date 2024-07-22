import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import { BigNumber } from "ethers";
import {
  IRedstoneAdapter,
  RedstoneAdapterBase,
} from "../../../typechain-types";
import { ContractData, RelayerConfig } from "../../types";
import { getValuesForDataFeeds } from "./get-values-for-data-feeds";

export type LastRoundTimestamps = {
  lastDataPackageTimestampMS: number;
  lastBlockTimestampMS: number;
};

export const getLatestTimestampsFromContract = async (
  adapterContract: IRedstoneAdapter,
  blockTag: number
): Promise<LastRoundTimestamps> => {
  const timestamps = await adapterContract.getTimestampsFromLatestUpdate({
    blockTag,
  });

  return {
    lastDataPackageTimestampMS: timestamps.dataTimestamp.toNumber(),
    lastBlockTimestampMS: timestamps.blockTimestamp.toNumber() * 1000,
  };
};

export const getLastRoundParamsFromContract = async (
  adapterContract: RedstoneAdapterBase,
  blockTag: number,
  relayerConfig: RelayerConfig
): Promise<ContractData> => {
  const { dataFeeds, updateConditions } = relayerConfig;
  // We fetch the latest values from contract only if we want to check value deviation
  const shouldCheckValueDeviation =
    updateConditions[dataFeeds[0]].includes("value-deviation");
  const { lastUpdateTimestamps, valuesFromContract } =
    await RedstoneCommon.waitForAllRecord({
      lastUpdateTimestamps: getLatestTimestampsFromContract(
        adapterContract,
        blockTag
      ),
      valuesFromContract: shouldCheckValueDeviation
        ? getValuesForDataFeeds(adapterContract, dataFeeds, blockTag)
        : Promise.resolve({} as ValuesForDataFeeds),
    });
  const { lastBlockTimestampMS, lastDataPackageTimestampMS } =
    lastUpdateTimestamps;
  const lastRoundParams: ContractData = {};
  for (const dataFeedId of dataFeeds) {
    lastRoundParams[dataFeedId] = {
      lastBlockTimestampMS,
      lastDataPackageTimestampMS,
      lastValue: valuesFromContract[dataFeedId] ?? BigNumber.from(0),
    };
  }
  return lastRoundParams;
};

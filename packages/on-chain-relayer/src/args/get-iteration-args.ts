import {
  BaseWrapper,
  DataPackagesWrapper,
} from "@redstone-finance/evm-connector";
import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { Contract } from "ethers";
import { RedstoneAdapterBase } from "../../typechain-types";
import { config } from "../config";
import { getLastRoundParamsFromContract } from "../core/contract-interactions/get-last-round-params";
import { getUniqueSignersThresholdFromContract } from "../core/contract-interactions/get-unique-signers-threshold";
import { getValuesForDataFeeds } from "../core/contract-interactions/get-values-for-data-feeds";
import { fetchDataPackages } from "../core/fetch-data-packages";
import { chooseDataPackagesTimestamp } from "../core/update-conditions/data-packages-timestamp";
import { shouldUpdate } from "../core/update-conditions/should-update";

type IterationArgs<T extends Contract> = {
  shouldUpdatePrices: boolean;
  args: UpdatePricesArgs<T>;
  message?: string;
};

export type UpdatePricesArgs<T extends Contract = Contract> = {
  proposedTimestamp: number;
  dataPackagesWrapper: BaseWrapper<T>;
  adapterContract: T;
};

export const getIterationArgs = async (
  adapterContract: RedstoneAdapterBase
): Promise<IterationArgs<RedstoneAdapterBase>> => {
  const relayerConfig = config();
  const { dataFeeds, updateConditions } = relayerConfig;

  const lastUpdateTimestamps =
    await getLastRoundParamsFromContract(adapterContract);

  const uniqueSignersThreshold =
    await getUniqueSignersThresholdFromContract(adapterContract);

  // We fetch the latest values from contract only if we want to check value deviation
  const shouldCheckValueDeviation =
    updateConditions.includes("value-deviation");
  let valuesFromContract: ValuesForDataFeeds = {};
  if (shouldCheckValueDeviation) {
    valuesFromContract = await getValuesForDataFeeds(
      adapterContract,
      dataFeeds
    );
  }
  const dataPackages = await fetchDataPackages(
    relayerConfig,
    uniqueSignersThreshold
  );

  const { shouldUpdatePrices, warningMessage } = await shouldUpdate(
    {
      dataPackages,
      valuesFromContract,
      uniqueSignersThreshold,
      lastUpdateTimestamps,
    },
    relayerConfig
  );

  const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);

  const dataPackagesWrapper = new DataPackagesWrapper<RedstoneAdapterBase>(
    dataPackages
  );

  return {
    shouldUpdatePrices,
    message: warningMessage,
    args: {
      adapterContract,
      proposedTimestamp,
      dataPackagesWrapper,
    },
  };
};

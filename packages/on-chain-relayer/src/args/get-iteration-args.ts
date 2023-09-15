import { getLastRoundParamsFromContract } from "../core/contract-interactions/get-last-round-params";
import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { getValuesForDataFeeds } from "../core/contract-interactions/get-values-for-data-feeds";
import { shouldUpdate } from "../core/update-conditions/should-update";
import {
  getUpdatePricesArgs,
  UpdatePricesArgs,
} from "./get-update-prices-args";
import { RedstoneAdapterBase } from "../../typechain-types";
import { config } from "../config";
import { fetchDataPackages } from "../core/fetch-data-packages";
import { getUniqueSignersThresholdFromContract } from "../core/contract-interactions/get-unique-signers-threshold";

type IterationArgs = {
  shouldUpdatePrices: boolean;
  args: UpdatePricesArgs;
  message?: string;
};

export const getIterationArgs = async (
  adapterContract: RedstoneAdapterBase,
): Promise<IterationArgs> => {
  const relayerConfig = config();
  const { dataFeeds, updateConditions } = relayerConfig;

  const lastUpdateTimestamps =
    await getLastRoundParamsFromContract(adapterContract);

  const uniqueSignersThreshold =
    await getUniqueSignersThresholdFromContract(adapterContract);

  // We fetch latest values from contract only if we want to check value deviation
  const shouldCheckValueDeviation =
    updateConditions.includes("value-deviation");
  let valuesFromContract: ValuesForDataFeeds = {};
  if (shouldCheckValueDeviation) {
    valuesFromContract = await getValuesForDataFeeds(
      adapterContract,
      dataFeeds,
    );
  }
  const dataPackages = await fetchDataPackages(
    relayerConfig,
    uniqueSignersThreshold,
    valuesFromContract,
  );

  const { shouldUpdatePrices, warningMessage } = await shouldUpdate(
    {
      dataPackages,
      valuesFromContract,
      uniqueSignersThreshold,
      lastUpdateTimestamps,
    },
    relayerConfig,
  );

  const updatePricesArgs = getUpdatePricesArgs(dataPackages, adapterContract);

  return {
    shouldUpdatePrices,
    message: warningMessage,
    args: updatePricesArgs,
  };
};

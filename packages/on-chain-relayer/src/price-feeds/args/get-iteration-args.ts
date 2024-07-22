import { DataPackagesResponse } from "@redstone-finance/sdk";
import { Contract } from "ethers";
import { RedstoneAdapterBase } from "../../../typechain-types";
import { config } from "../../config";
import { getUniqueSignersThresholdFromContract } from "../../core/contract-interactions/get-unique-signers-threshold";
import { fetchDataPackages } from "../../core/fetch-data-packages";
import { shouldUpdate } from "../should-update";
import { getLastRoundParamsFromContract } from "./get-last-round-params";

type IterationArgs<T extends Contract> = {
  shouldUpdatePrices: boolean;
  args: UpdatePricesArgs<T>;
  message?: string;
};

export type UpdatePricesArgs<T extends Contract = Contract> = {
  adapterContract: T;
  blockTag: number;
  fetchDataPackages: () => Promise<DataPackagesResponse>;
};

export const getIterationArgs = async (
  adapterContract: RedstoneAdapterBase
): Promise<IterationArgs<RedstoneAdapterBase>> => {
  const relayerConfig = config();
  const blockTag = await adapterContract.provider.getBlockNumber();
  const uniqueSignersThreshold = await getUniqueSignersThresholdFromContract(
    adapterContract,
    blockTag
  );

  const dataPackages = await fetchDataPackages(
    relayerConfig,
    uniqueSignersThreshold
  );

  const dataFromContract = await getLastRoundParamsFromContract(
    adapterContract,
    blockTag,
    relayerConfig
  );

  const { shouldUpdatePrices, warningMessage } = await shouldUpdate(
    {
      dataPackages,
      dataFromContract,
      uniqueSignersThreshold,
    },
    relayerConfig
  );

  return {
    shouldUpdatePrices,
    message: warningMessage,
    args: {
      adapterContract,
      blockTag,
      fetchDataPackages: () =>
        fetchDataPackages(relayerConfig, uniqueSignersThreshold),
    },
  };
};

import { DataPackagesResponse } from "@redstone-finance/sdk";
import { Contract } from "ethers";
import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { config } from "../config";
import { getBlockTag } from "../contract-interactions/get-block-tag";
import { getUniqueSignersThresholdFromContract } from "../contract-interactions/get-unique-signers-threshold";
import { shouldUpdate } from "../update-conditions/should-update";
import {
  ContractData,
  fetchDataFromContract,
} from "./fetch-data-from-contract";
import { fetchDataPackages } from "./fetch-data-packages-from-gateway";

type IterationArgs<T extends Contract> = {
  shouldUpdatePrices: boolean;
  args: UpdatePricesArgs<T>;
  message?: string;
};

export type UpdatePricesArgs<T extends Contract = Contract> = {
  dataFeedsToUpdate: string[];
  adapterContract: T;
  blockTag: number;
  fetchDataPackages: () => Promise<DataPackagesResponse>;
};

let adapterContract: undefined | MultiFeedAdapterWithoutRounds = undefined;

const getDataFromContract = async () => {
  return await fetchDataFromContract(adapterContract!);
};

const getDataFromGateways = async () => {
  const relayerConfig = config();
  const uniqueSignersThreshold = await getUniqueSignersThresholdFromContract(
    adapterContract!
  );
  return {
    gatewayData: await fetchDataPackages(
      relayerConfig.dataFeeds,
      relayerConfig,
      uniqueSignersThreshold
    ),
    fetchDataPackages: (dataFeedIds: string[]) =>
      fetchDataPackages(dataFeedIds, relayerConfig, uniqueSignersThreshold),
  };
};

const chooseDataFeedsToUpdate = async (
  dataPackages: DataPackagesResponse,
  dataFromContract: ContractData
) => {
  const relayerConfig = config();
  const uniqueSignersThreshold = await getUniqueSignersThresholdFromContract(
    adapterContract!
  );

  const { dataFeedsToUpdate, warningMessage } = await shouldUpdate(
    {
      dataPackages,
      dataFromContract,
      uniqueSignersThreshold,
    },
    relayerConfig
  );

  return { dataFeedsToUpdate, warningMessage };
};

export const getIterationArgs = async (
  _adapterContract: MultiFeedAdapterWithoutRounds
): Promise<IterationArgs<MultiFeedAdapterWithoutRounds>> => {
  adapterContract = _adapterContract;
  const { gatewayData, fetchDataPackages } = await getDataFromGateways();
  const contractData = await getDataFromContract();

  const { dataFeedsToUpdate, warningMessage: message } =
    await chooseDataFeedsToUpdate(gatewayData, contractData);

  return {
    shouldUpdatePrices: dataFeedsToUpdate.length > 0,
    args: {
      adapterContract,
      dataFeedsToUpdate,
      blockTag: getBlockTag(),
      fetchDataPackages: () => fetchDataPackages(dataFeedsToUpdate),
    },
    message,
  };
};

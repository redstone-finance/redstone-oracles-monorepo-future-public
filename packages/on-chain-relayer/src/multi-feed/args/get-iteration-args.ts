import { MultiFeedAdapterWithoutRounds } from "../../../typechain-types";
import { config } from "../../config";
import { getUniqueSignersThresholdFromContract } from "../../core/contract-interactions/get-unique-signers-threshold";
import { fetchDataPackages } from "../../core/fetch-data-packages";
import { IterationArgs, RelayerConfig } from "../../types";
import { shouldUpdate } from "../should-update";
import { getLastRoundParamsFromContract } from "./get-last-round-params";

const getDataFromGateways = async (
  relayerConfig: RelayerConfig,
  uniqueSignersThreshold: number
) => {
  return {
    gatewayData: await fetchDataPackages(
      relayerConfig,
      uniqueSignersThreshold,
      false,
      relayerConfig.dataFeeds
    ),
    fetchDataPackages: (dataFeedIds: string[]) =>
      fetchDataPackages(
        relayerConfig,
        uniqueSignersThreshold,
        false,
        dataFeedIds
      ),
  };
};

export const getIterationArgs = async (
  adapterContract: MultiFeedAdapterWithoutRounds
): Promise<IterationArgs<MultiFeedAdapterWithoutRounds>> => {
  const relayerConfig = config();
  const blockTag = await adapterContract.provider.getBlockNumber();
  const uniqueSignersThreshold = await getUniqueSignersThresholdFromContract(
    adapterContract,
    blockTag
  );
  const { gatewayData, fetchDataPackages } = await getDataFromGateways(
    relayerConfig,
    uniqueSignersThreshold
  );
  const contractData = await getLastRoundParamsFromContract(
    adapterContract,
    blockTag
  );

  const {
    dataFeedsToUpdate,
    dataFeedsDeviationRatios,
    heartbeatUpdates,
    warningMessage: message,
  } = await shouldUpdate(
    {
      dataPackages: gatewayData,
      dataFromContract: contractData,
      uniqueSignersThreshold,
    },
    relayerConfig
  );

  return {
    shouldUpdatePrices: dataFeedsToUpdate.length > 0,
    args: {
      adapterContract,
      dataFeedsToUpdate,
      dataFeedsDeviationRatios,
      heartbeatUpdates,
      blockTag,
      fetchDataPackages: () => fetchDataPackages(dataFeedsToUpdate),
    },
    message,
  };
};

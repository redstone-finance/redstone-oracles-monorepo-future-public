import { config } from "../../config";
import { fetchDataPackages } from "../../core/fetch-data-packages";
import { getIterationArgsBase } from "../../core/get-iteration-args-base";
import { IContractFacade } from "../../facade/IContractFacade";
import { RelayerConfig } from "../../types";
import { shouldUpdate } from "../should-update";

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

export const getIterationArgs = async (contractFacade: IContractFacade) => {
  const relayerConfig = config();
  const { blockTag, uniqueSignersThreshold, dataFromContract } =
    await getIterationArgsBase(contractFacade, relayerConfig);

  const { gatewayData, fetchDataPackages } = await getDataFromGateways(
    relayerConfig,
    uniqueSignersThreshold
  );

  const {
    dataFeedsToUpdate,
    dataFeedsDeviationRatios,
    heartbeatUpdates,
    warningMessage: message,
  } = await shouldUpdate(
    {
      dataPackages: gatewayData,
      dataFromContract,
      uniqueSignersThreshold,
    },
    relayerConfig
  );

  return {
    shouldUpdatePrices: dataFeedsToUpdate.length > 0,
    args: {
      dataFeedsToUpdate,
      dataFeedsDeviationRatios,
      heartbeatUpdates,
      blockTag,
      fetchDataPackages: () => fetchDataPackages(dataFeedsToUpdate),
    },
    message,
  };
};

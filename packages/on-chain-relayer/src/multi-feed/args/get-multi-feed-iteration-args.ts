import { makeDataPackagesRequestParams } from "../../core/make-data-packages-request-params";
import { ContractFacade } from "../../facade/ContractFacade";
import { RelayerConfig, ShouldUpdateContext } from "../../types";
import { shouldUpdateInMultiFeed } from "../should-update-in-multi-feed";

export const getMultiFeedIterationArgs = async (
  contractFacade: ContractFacade,
  context: ShouldUpdateContext,
  relayerConfig: RelayerConfig
) => {
  const {
    dataFeedsToUpdate,
    dataFeedsDeviationRatios,
    heartbeatUpdates,
    warningMessage: message,
  } = await shouldUpdateInMultiFeed(context, relayerConfig);

  const updateRequestParams = makeDataPackagesRequestParams(
    relayerConfig,
    context.uniqueSignersThreshold,
    dataFeedsToUpdate
  );

  return {
    shouldUpdatePrices: dataFeedsToUpdate.length > 0,
    args: {
      dataFeedsToUpdate,
      dataFeedsDeviationRatios,
      heartbeatUpdates,
      blockTag: context.blockTag,
      updateRequestParams,
      fetchDataPackages: async () =>
        await contractFacade
          .getContractParamsProvider(updateRequestParams)
          .requestDataPackages(),
    },
    message,
  };
};

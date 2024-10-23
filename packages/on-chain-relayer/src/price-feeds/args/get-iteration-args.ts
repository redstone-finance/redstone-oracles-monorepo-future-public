import { config } from "../../config";
import { fetchDataPackages } from "../../core/fetch-data-packages";
import { getIterationArgsBase } from "../../core/get-iteration-args-base";
import { IContractFacade } from "../../facade/IContractFacade";
import { shouldUpdate } from "../should-update";

export const getIterationArgs = async (contractFacade: IContractFacade) => {
  const relayerConfig = config();
  const { blockTag, uniqueSignersThreshold, dataFromContract } =
    await getIterationArgsBase(contractFacade, relayerConfig);

  const dataPackages = await fetchDataPackages(
    relayerConfig,
    uniqueSignersThreshold
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
      blockTag,
      fetchDataPackages: () =>
        fetchDataPackages(relayerConfig, uniqueSignersThreshold),
    },
  };
};

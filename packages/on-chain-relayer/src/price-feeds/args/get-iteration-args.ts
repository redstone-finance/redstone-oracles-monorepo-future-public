import { RelayerConfig } from "../../config/RelayerConfig";
import { makeDataPackagesRequestParams } from "../../core/make-data-packages-request-params";
import { ShouldUpdateContext } from "../../types";
import { shouldUpdate } from "../should-update";

export const getIterationArgs = async (
  context: ShouldUpdateContext,
  relayerConfig: RelayerConfig
) => {
  const { shouldUpdatePrices, messages } = await shouldUpdate(
    context,
    relayerConfig
  );

  const updateRequestParams = makeDataPackagesRequestParams(
    relayerConfig,
    context.uniqueSignersThreshold
  );

  return {
    shouldUpdatePrices,
    messages,
    args: {
      blockTag: context.blockTag,
      updateRequestParams,
      dataFeedsToUpdate: relayerConfig.dataFeeds,
    },
  };
};

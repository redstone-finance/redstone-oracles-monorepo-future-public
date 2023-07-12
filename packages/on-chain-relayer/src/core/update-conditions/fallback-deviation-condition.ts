import { RelayerConfig } from "../../types";
import { DataPackagesResponse, ValuesForDataFeeds } from "redstone-sdk";
import { valueDeviationCondition } from "./value-deviation-condition";

export const fallbackDeviationCondition = (
  latestDataPackages: DataPackagesResponse,
  olderDataPackages: DataPackagesResponse,
  valuesFromContract: ValuesForDataFeeds,
  config: RelayerConfig
) => {
  const { shouldUpdatePrices, warningMessage } = valueDeviationCondition(
    latestDataPackages,
    valuesFromContract,
    config
  );
  const {
    shouldUpdatePrices: olderShouldUpdatePrices,
    warningMessage: olderWarningMessage,
  } = valueDeviationCondition(olderDataPackages, valuesFromContract, config);

  return {
    shouldUpdatePrices: shouldUpdatePrices && olderShouldUpdatePrices,
    warningMessage: `Fallback deviation: ${warningMessage} AND Older ${olderWarningMessage}`,
  };
};

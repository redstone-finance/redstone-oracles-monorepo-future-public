import { RelayerConfig } from "../../types";
import { DataPackagesResponse, ValuesForDataFeeds } from "redstone-sdk";
import { checkValueDeviationCondition } from "./check-value-deviation-condition";
import { fetchDataPackages } from "../fetch-data-packages";

export const performValueDeviationConditionChecks = async (
  latestDataPackages: DataPackagesResponse,
  valuesFromContract: ValuesForDataFeeds,
  config: RelayerConfig,
  olderDataPackagesFetchCallback: () => Promise<DataPackagesResponse>
) => {
  const { shouldUpdatePrices, warningMessage } = checkValueDeviationCondition(
    latestDataPackages,
    valuesFromContract,
    config
  );

  const isFallback = (config.fallbackOffsetInMinutes ?? 0) > 0;
  let olderShouldUpdatePrices = true;
  let olderWarningMessage = "";

  if (shouldUpdatePrices && isFallback) {
    const olderDataPackages = await olderDataPackagesFetchCallback();

    const {
      shouldUpdatePrices: olderShouldUpdatePricesTmp,
      warningMessage: olderWarningMessageTmp,
    } = checkValueDeviationCondition(
      olderDataPackages,
      valuesFromContract,
      config
    );

    olderShouldUpdatePrices = olderShouldUpdatePricesTmp;
    olderWarningMessage = ` AND Older ${olderWarningMessageTmp}`;
  }

  return {
    shouldUpdatePrices: shouldUpdatePrices && olderShouldUpdatePrices,
    warningMessage: `${
      isFallback ? "Fallback deviation: " : ""
    }${warningMessage}${olderWarningMessage}`,
  };
};

export const valueDeviationCondition = async (
  latestDataPackages: DataPackagesResponse,
  uniqueSignersThreshold: number,
  valuesFromContract: ValuesForDataFeeds,
  config: RelayerConfig
) => {
  const olderDataPackagesFetchCallback = async () => {
    return await fetchDataPackages(
      config,
      uniqueSignersThreshold,
      valuesFromContract,
      true
    );
  };

  return await performValueDeviationConditionChecks(
    latestDataPackages,
    valuesFromContract,
    config,
    olderDataPackagesFetchCallback
  );
};

import { INumericDataPoint } from "@redstone-finance/protocol";
import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { config } from "../../src/config";
import { performValueDeviationConditionChecks } from "../../src/core/update-conditions/value-deviation-condition";
import { createNumberFromContract, getDataPackagesResponse } from "../helpers";

export const HISTORICAL_DATA_POINTS = [
  { dataFeedId: "ETH", value: 1660.99 },
  { dataFeedId: "BTC", value: 23088.68 },
];
export const VERY_SMALL_DATA_POINTS = [
  { dataFeedId: "ETH", value: 660.99 },
  { dataFeedId: "BTC", value: 3066.68 },
];

export const performFallbackValueDeviationConditionTest = async (
  ethPrice: number,
  btcPrice: number,
  dataPoints: INumericDataPoint[],
  lastUpdateTimestamp: number = Date.now()
) => {
  const dataPackages = await getDataPackagesResponse();
  const olderDataPackagesFetchCallback = () =>
    getDataPackagesResponse(dataPoints);
  const valueDiff: ValuesForDataFeeds = {
    ETH: createNumberFromContract(ethPrice),
    BTC: createNumberFromContract(btcPrice),
  };
  const { shouldUpdatePrices, warningMessage } =
    await performValueDeviationConditionChecks(
      dataPackages,
      valueDiff,
      lastUpdateTimestamp,
      config(),
      olderDataPackagesFetchCallback
    );
  return { shouldUpdatePrices, warningMessage };
};

import { INumericDataPoint } from "@redstone-finance/protocol";
import { config } from "../../src/config";
import { performValueDeviationConditionChecks } from "../../src/core/update-conditions/value-deviation-condition";
import {
  createNumberFromContract,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";

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
  lastUpdateTimestamp = Date.now(),
  lastDataPackageTimestamp = 0
) => {
  const dataPackages = await getDataPackagesResponse();
  const olderDataPackagesFetchCallback = () =>
    getDataPackagesResponse(dataPoints, true, Date.now());
  const ethValue = createNumberFromContract(ethPrice);
  const btcValue = createNumberFromContract(btcPrice);
  const { shouldUpdatePrices, messages: warningMessage } =
    await performValueDeviationConditionChecks(
      "ETH",
      dataPackages,
      {
        lastValue: ethValue,
        lastBlockTimestampMS: lastUpdateTimestamp,
        lastDataPackageTimestampMS: lastDataPackageTimestamp,
      },
      config(),
      olderDataPackagesFetchCallback
    );
  const { shouldUpdatePrices: shouldUpdatePrices2, messages: warningMessage2 } =
    await performValueDeviationConditionChecks(
      "BTC",
      dataPackages,
      {
        lastValue: btcValue,
        lastBlockTimestampMS: lastUpdateTimestamp,
        lastDataPackageTimestampMS: lastDataPackageTimestamp,
      },
      config(),
      olderDataPackagesFetchCallback
    );
  warningMessage.push(...warningMessage2);

  return {
    shouldUpdatePrices: shouldUpdatePrices || shouldUpdatePrices2,
    warningMessage: `${warningMessage[0].message}; ${warningMessage2[0].message}`,
  };
};

export async function performSkipFrequentUpdatesCheck(
  isNotEnoughTimeElapsed: boolean,
  isUpdatedDataPackageNewerThanHistorical: boolean
) {
  mockEnvVariables({
    fallbackOffsetInMilliseconds: 60_000,
    historicalPackagesGateways: ["X"],
    fallbackSkipDeviationBasedFrequentUpdates: true,
  });
  const { shouldUpdatePrices, warningMessage } =
    await performFallbackValueDeviationConditionTest(
      1230.99,
      13011.68,
      HISTORICAL_DATA_POINTS,
      Date.now() - (isNotEnoughTimeElapsed ? 0 : 2 * 60000),
      isUpdatedDataPackageNewerThanHistorical ? Date.now() : 0
    );

  return { shouldUpdatePrices, warningMessage };
}

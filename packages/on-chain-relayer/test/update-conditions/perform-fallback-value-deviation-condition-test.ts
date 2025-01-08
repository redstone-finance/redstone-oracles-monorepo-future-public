import { INumericDataPoint } from "@redstone-finance/protocol";
import { RelayerConfig } from "../../src";
import { valueDeviationCondition } from "../../src/core/update-conditions/value-deviation-condition";
import {
  createNumberFromContract,
  getDataPackagesResponse,
  mockConfig,
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
  relayerConfig: RelayerConfig,
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
    await valueDeviationCondition(
      "ETH",
      dataPackages,
      {
        lastValue: ethValue,
        lastBlockTimestampMS: lastUpdateTimestamp,
        lastDataPackageTimestampMS: lastDataPackageTimestamp,
      },
      relayerConfig,
      olderDataPackagesFetchCallback
    );
  const { shouldUpdatePrices: shouldUpdatePrices2, messages: warningMessage2 } =
    await valueDeviationCondition(
      "BTC",
      dataPackages,
      {
        lastValue: btcValue,
        lastBlockTimestampMS: lastUpdateTimestamp,
        lastDataPackageTimestampMS: lastDataPackageTimestamp,
      },
      relayerConfig,
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
  const relayerConfig = mockConfig({
    fallbackOffsetInMilliseconds: 60_000,
    historicalPackagesGateways: ["X"],
    fallbackSkipDeviationBasedFrequentUpdates: true,
  });
  const { shouldUpdatePrices, warningMessage } =
    await performFallbackValueDeviationConditionTest(
      relayerConfig,
      1230.99,
      13011.68,
      HISTORICAL_DATA_POINTS,
      Date.now() - (isNotEnoughTimeElapsed ? 0 : 2 * 60000),
      isUpdatedDataPackageNewerThanHistorical ? Date.now() : 0
    );

  return { shouldUpdatePrices, warningMessage };
}

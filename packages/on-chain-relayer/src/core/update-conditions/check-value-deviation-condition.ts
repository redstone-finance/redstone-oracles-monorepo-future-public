import { consts, INumericDataPoint } from "@redstone-finance/protocol";
import {
  DataPackagesResponse,
  ValuesForDataFeeds,
} from "@redstone-finance/sdk";
import { MathUtils } from "@redstone-finance/utils";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { RelayerConfig } from "../../types";

export const checkValueDeviationCondition = (
  dataPackages: DataPackagesResponse,
  valuesFromContract: ValuesForDataFeeds,
  config: RelayerConfig
) => {
  const dataFeedsIds = Object.keys(dataPackages);

  const logTrace = new ValueDeviationLogTrace();

  let maxDeviation = 0;
  let shouldUpdatePrices = false;
  for (const dataFeedId of dataFeedsIds) {
    const valueFromContract =
      valuesFromContract[dataFeedId] ?? BigNumber.from(0);

    for (const { dataPackage } of dataPackages[dataFeedId]!) {
      for (const dataPoint of dataPackage.dataPoints) {
        const dataPointObj = dataPoint.toObj() as INumericDataPoint;

        const valueFromContractAsDecimal = Number(
          formatUnits(
            valueFromContract.toString(),
            dataPointObj.decimals ?? consts.DEFAULT_NUM_VALUE_DECIMALS
          )
        );

        logTrace.addPerDataFeedLog(
          dataPackage.timestampMilliseconds,
          valueFromContractAsDecimal,
          dataPackages[dataFeedId]!.length,
          dataPointObj
        );

        const currentDeviation = calculateDeviation(
          dataPointObj.value,
          valueFromContractAsDecimal
        );

        if (config.priceFeedsDeviationOverrides?.[dataFeedId]) {
          shouldUpdatePrices ||=
            currentDeviation >=
            config.priceFeedsDeviationOverrides[dataFeedId]!;
          logTrace.addDeviationInfo(
            currentDeviation,
            config.priceFeedsDeviationOverrides[dataFeedId]!,
            dataFeedId
          );
        } else {
          maxDeviation = Math.max(currentDeviation, maxDeviation);
        }
      }
    }
  }

  const { minDeviationPercentage } = config;
  shouldUpdatePrices ||= maxDeviation >= minDeviationPercentage!;
  logTrace.addDeviationInfo(maxDeviation, minDeviationPercentage!);

  return {
    shouldUpdatePrices,
    warningMessage: shouldUpdatePrices
      ? `Value has deviated enough to be updated. ${logTrace.toString()}`
      : `Value has not deviated enough to be updated. ${logTrace.toString()}`,
  };
};

const calculateDeviation = (
  valueFromFetchedDataPackage: number,
  valueFromContract: number
) => {
  return MathUtils.calculateDeviationPercent({
    deviatedValue: valueFromFetchedDataPackage,
    baseValue: valueFromContract,
  });
};

class ValueDeviationLogTrace {
  private perDataFeedId: Record<
    string,
    | {
        valueFromContract: number;
        valuesFromNode: number[];
        timestamp: number;
        packagesCount: number;
      }
    | undefined
  > = {};
  private deviationLogs: {
    maxDeviation: string;
    thresholdDeviation: string;
    dataFeedId?: string;
  }[] = [];

  addPerDataFeedLog(
    timestamp: number,
    valueFromContract: number,
    packagesCount: number,
    dataPoint: INumericDataPoint
  ) {
    const dataFeedId = dataPoint.dataFeedId;
    const perData = this.perDataFeedId[dataFeedId];
    if (!perData) {
      this.perDataFeedId[dataFeedId] = {
        valueFromContract: valueFromContract,
        valuesFromNode: [dataPoint.value],
        packagesCount,
        timestamp,
      };
    } else {
      perData.valuesFromNode.push(dataPoint.value);
    }
  }

  addDeviationInfo(
    maxDeviation: number,
    thresholdDeviation: number,
    dataFeedId?: string
  ) {
    this.deviationLogs.push({
      maxDeviation: maxDeviation.toFixed(4),
      thresholdDeviation: thresholdDeviation.toFixed(4),
      dataFeedId,
    });
  }

  toString(): string {
    return JSON.stringify({
      ...this.perDataFeedId,
      ...this.deviationLogs,
    });
  }
}

import { BigNumber } from "ethers";
import { INumericDataPoint } from "redstone-protocol";
import { DataPackagesResponse, ValuesForDataFeeds } from "redstone-sdk";
import { RelayerConfig } from "../../types";
import { formatUnits } from "ethers/lib/utils";
import { MathUtils } from "redstone-utils";

const DEFAULT_DECIMALS = 8;

export const checkValueDeviationCondition = (
  dataPackages: DataPackagesResponse,
  valuesFromContract: ValuesForDataFeeds,
  config: RelayerConfig
) => {
  const dataFeedsIds = Object.keys(dataPackages);

  const logTrace = new ValueDeviationLogTrace();

  let maxDeviation = 0;
  for (const dataFeedId of dataFeedsIds) {
    const valueFromContract =
      valuesFromContract[dataFeedId] ?? BigNumber.from(0);

    for (const { dataPackage } of dataPackages[dataFeedId]) {
      for (const dataPoint of dataPackage.dataPoints) {
        const dataPointObj = dataPoint.toObj() as INumericDataPoint;

        const valueFromContractAsDecimal = Number(
          formatUnits(
            valueFromContract.toString(),
            dataPointObj.decimals ?? DEFAULT_DECIMALS
          )
        );

        logTrace.addPerDataFeedLog(
          dataPackage.timestampMilliseconds,
          valueFromContractAsDecimal,
          dataPackages[dataFeedId].length,
          dataPointObj
        );

        const currentDeviation = calculateDeviation(
          dataPointObj.value,
          valueFromContractAsDecimal
        );
        maxDeviation = Math.max(currentDeviation, maxDeviation);
      }
    }
  }

  const { minDeviationPercentage } = config;
  const shouldUpdatePrices = maxDeviation >= minDeviationPercentage!;
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
    newValue: valueFromFetchedDataPackage,
    prevValue: valueFromContract,
  });
};

class ValueDeviationLogTrace {
  private perDataFeedId: Record<
    string,
    {
      valueFromContract: number;
      valuesFromNode: number[];
      timestamp: number;
      packagesCount: number;
    }
  > = {};
  private maxDeviation!: string;
  private thresholdDeviation!: string;

  addPerDataFeedLog(
    timestamp: number,
    valueFromContract: number,
    packagesCount: number,
    dataPoint: INumericDataPoint
  ) {
    const dataFeedId = dataPoint.dataFeedId;
    if (!this.perDataFeedId[dataFeedId]) {
      this.perDataFeedId[dataFeedId] = {
        valueFromContract: valueFromContract,
        valuesFromNode: [dataPoint.value],
        packagesCount,
        timestamp,
      };
    } else {
      this.perDataFeedId[dataFeedId].valuesFromNode.push(dataPoint.value);
    }
  }

  addDeviationInfo(maxDeviation: number, thresholdDeviation: number) {
    this.maxDeviation = maxDeviation.toFixed(4);
    this.thresholdDeviation = thresholdDeviation.toFixed(4);
  }

  toString(): string {
    return JSON.stringify({
      ...this.perDataFeedId,
      maxDeviation: this.maxDeviation,
      thresholdDeviation: this.thresholdDeviation,
    });
  }
}

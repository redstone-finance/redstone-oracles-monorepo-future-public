import {
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "@redstone-finance/protocol";
import { MathUtils, SafeNumber } from "@redstone-finance/utils";
import _ from "lodash";

export const pickDataFeedPackagesClosestToMedian = (
  dataFeedPackages: SignedDataPackagePlainObj[],
  count: number
): SignedDataPackage[] => {
  const allValues = getAllValues(dataFeedPackages) as Record<string, number[]>;
  const allMedians = _.mapValues(allValues, MathUtils.getMedian);

  return sortByDistanceFromMedian(dataFeedPackages, allMedians)
    .map((diff) => SignedDataPackage.fromObj(diff.dp))
    .slice(0, count);
};

const getMaxDistanceFromMedian = (
  dataPackage: SignedDataPackagePlainObj,
  medians: Record<string, number>
) => {
  let maxDistanceFromMedian = 0;
  for (const dataPoint of dataPackage.dataPoints) {
    maxDistanceFromMedian = Math.max(
      maxDistanceFromMedian,
      SafeNumber.createSafeNumber(dataPoint.value)
        .sub(medians[dataPoint.dataFeedId])
        .abs()
        .div(medians[dataPoint.dataFeedId])
        .unsafeToNumber()
    );
  }
  return maxDistanceFromMedian;
};

function sortByDistanceFromMedian(
  dataFeedPackages: SignedDataPackagePlainObj[],
  medians: Record<string, number>
) {
  return dataFeedPackages
    .map((dp) => ({
      dp,
      diff: getMaxDistanceFromMedian(dp, medians),
    }))
    .sort((first, second) => first.diff - second.diff);
}

const getAllValues = (dataPackages: SignedDataPackagePlainObj[]) => {
  const allValues: Partial<Record<string, number[]>> = {};
  for (const dataPackage of dataPackages) {
    for (const dataPoint of dataPackage.dataPoints) {
      allValues[dataPoint.dataFeedId] ??= [];
      allValues[dataPoint.dataFeedId]!.push(Number(dataPoint.value));
    }
  }
  return allValues;
};

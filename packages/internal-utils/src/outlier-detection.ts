import { DataPackagePlainObj } from "@redstone-finance/protocol";
import { MathUtils } from "@redstone-finance/utils";

const MAX_DEVIATION_PERCENT = 5;

// We filter out only when single outlier exists
// We filter out only when at least 3 packages for single dataFeedId
// We never filter out non NumericDataPoints
export function filterOutliers<
  T extends Record<string, DataPackagePlainObj[] | undefined>,
>(dataPackages: T): T {
  const result: Record<string, DataPackagePlainObj[] | undefined> = {
    ...dataPackages,
  };

  for (const [dataPackageId, packages] of Object.entries(dataPackages)) {
    const filteredPackages = packages?.filter(
      (pkg) => pkg.dataPoints.length === 1
    );

    if (!filteredPackages || filteredPackages.length < 3) {
      continue;
    }

    let hasNonNumericDataPoint = false;
    const dataPackagesWithValues = [];
    for (const pkg of filteredPackages) {
      const dp = pkg.dataPoints[0];
      if (isNaN(Number(dp.value))) {
        hasNonNumericDataPoint = true;
        break;
      }
      dataPackagesWithValues.push({ pkg, value: dp.value });
    }

    if (hasNonNumericDataPoint) {
      // skip data packages that have non-numeric data points
      continue;
    }

    const median = MathUtils.getMedian(
      dataPackagesWithValues.map((pkg) => pkg.value)
    );
    const filteredDataPackages = dataPackagesWithValues.filter((pkg) => {
      const deviation = MathUtils.calculateDeviationPercent({
        baseValue: median,
        deviatedValue: pkg.value,
      });
      return deviation <= MAX_DEVIATION_PERCENT;
    });

    if (filteredDataPackages.length === packages!.length - 1) {
      result[dataPackageId] = filteredDataPackages.map((x) => x.pkg);
    }
  }

  return result as T;
}

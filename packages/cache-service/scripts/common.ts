import {
  CachedDataPackage,
  DataPackage,
} from "../src/data-packages/data-packages.model";

interface QueryDataPackagesParams {
  startTimestamp: number;
  endTimestamp: number;
  dataFeedId: string;
  dataServiceId: string;
}

interface DataPackagesGroupedByField {
  [signer: string]: CachedDataPackage[];
}

export async function queryDataPackages({
  startTimestamp,
  endTimestamp,
  dataFeedId,
  dataServiceId,
}: QueryDataPackagesParams): Promise<CachedDataPackage[]> {
  return await DataPackage.find(
    {
      timestampMilliseconds: {
        $gte: startTimestamp,
        $lte: endTimestamp,
      },
      dataFeedId,
      dataServiceId,
    },
    { timestampMilliseconds: 1, signerAddress: 1, dataPoints: 1 }
  );
}

export function groupDataPackagesByField(
  dataPackages: CachedDataPackage[],
  field: "signerAddress" | "timestampMilliseconds"
): DataPackagesGroupedByField {
  const groupedBySigner: DataPackagesGroupedByField = {};

  for (const dataPackage of dataPackages) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!groupedBySigner[dataPackage[field]]) {
      groupedBySigner[dataPackage[field]] = [];
    }
    groupedBySigner[dataPackage[field]].push(dataPackage);
  }

  return groupedBySigner;
}

export function getDeviationPercentage(a: number, b: number) {
  return Math.abs((a - b) / Math.min(a, b)) * 100;
}

export function formatTime(timestamp: number) {
  return new Date(timestamp).toISOString();
}

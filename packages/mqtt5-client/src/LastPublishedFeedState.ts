import { DataPackagesResponse } from "@redstone-finance/sdk";

export class LastPublishedFeedState {
  private lastPublishPerFeed: Map<string, number>;

  constructor(dataPackageIds: string[], initTimestamp: number) {
    this.lastPublishPerFeed = new Map(
      dataPackageIds.map((id) => [id, initTimestamp])
    );
  }

  isNewerThanLastPublished(dataPackageId: string, timestamp: number) {
    return timestamp > this.lastPublishPerFeed.get(dataPackageId)!;
  }

  isAnyFeedNotPublishedIn(maxDelay: number) {
    const now = Date.now();
    return [...this.lastPublishPerFeed.values()].some(
      (timestamp) => now - timestamp > maxDelay
    );
  }

  getLastPublishTime(dataPackageId: string) {
    return this.lastPublishPerFeed.get(dataPackageId)!;
  }

  update(dataPackageIds: string[], newTimestamp: number) {
    for (const dataPackageId of dataPackageIds) {
      this.lastPublishPerFeed.set(dataPackageId, newTimestamp);
    }
  }

  filterOutNotNewerPackages(
    dataPackagesResponse: DataPackagesResponse
  ): DataPackagesResponse {
    return Object.fromEntries(
      Object.entries(dataPackagesResponse).filter(([dataPackageId, packages]) =>
        this.isNewerThanLastPublished(
          dataPackageId,
          packages![0].dataPackage.timestampMilliseconds
        )
      )
    );
  }

  toString() {
    return [...this.lastPublishPerFeed.entries()]
      .map(([dataPackageId, timestamp]) => `${dataPackageId}:${timestamp}`)
      .join(" ");
  }
}

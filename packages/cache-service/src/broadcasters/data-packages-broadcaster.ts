import { CachedDataPackage } from "../data-packages/data-packages.model";

export interface DataPackagesBroadcaster {
  broadcast(dataPackages: CachedDataPackage[]): Promise<void>;
}

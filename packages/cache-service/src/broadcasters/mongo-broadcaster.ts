import { Injectable } from "@nestjs/common";
import {
  CachedDataPackage,
  DataPackage,
} from "../data-packages/data-packages.model";
import { DataPackagesBroadcaster } from "./data-packages-broadcaster";

@Injectable()
export class MongoBroadcaster implements DataPackagesBroadcaster {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async broadcast(dataPackages: CachedDataPackage[]): Promise<void> {
    await DataPackage.insertMany(dataPackages);
  }
}

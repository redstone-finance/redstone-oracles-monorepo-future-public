import { Injectable, Logger } from "@nestjs/common";
import { RedstoneCommon } from "@redstone-finance/utils";
import {
  CachedDataPackage,
  DataPackage,
} from "../data-packages/data-packages.model";
import { DataPackagesBroadcaster } from "./data-packages-broadcaster";

@Injectable()
export class MongoBroadcaster implements DataPackagesBroadcaster {
  private readonly logger = new Logger(MongoBroadcaster.name);

  async broadcast(
    dataPackages: CachedDataPackage[],
    nodeEvmAddress: string
  ): Promise<void> {
    const message = `broadcast ${dataPackages.length} data packages for node ${nodeEvmAddress}`;

    await DataPackage.insertMany(dataPackages)
      .then((result) => {
        this.logger.log(`[${MongoBroadcaster.name}] succeeded to ${message}.`);
        return result;
      })
      .catch((error) => {
        this.logger.error(
          `[${
            MongoBroadcaster.name
          }] failed to ${message}. ${RedstoneCommon.stringifyError(error)}`
        );
        throw error;
      });
  }
}

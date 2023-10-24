import { Injectable, Logger } from "@nestjs/common";
import {
  CachedDataPackage,
  DataPackage,
} from "../data-packages/data-packages.model";
import { DataPackagesBroadcaster } from "./data-packages-broadcaster";
import { RedstoneCommon } from "@redstone-finance/utils";

@Injectable()
export class MongoBroadcaster implements DataPackagesBroadcaster {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
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

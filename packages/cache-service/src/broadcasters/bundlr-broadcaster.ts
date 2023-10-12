import { Injectable, Logger } from "@nestjs/common";
import { CachedDataPackage } from "../data-packages/data-packages.model";
import Bundlr from "@bundlr-network/client";
import config from "../config";
import { DataPackagesBroadcaster } from "./data-packages-broadcaster";

const REDSTONE_TYPE_TAG_VALUE = "redstone-oracles";

@Injectable()
export class BundlrBroadcaster implements DataPackagesBroadcaster {
  private readonly logger = new Logger(BundlrBroadcaster.name);
  private bundlrClient: Bundlr | undefined;

  constructor() {
    if (config.enableArchivingOnArweave) {
      this.bundlrClient = new Bundlr(
        config.bundlrNodeUrl,
        "arweave",
        config.arweaveJwkKey
      );
    }
  }

  async broadcast(dataPackages: CachedDataPackage[]): Promise<void> {
    for (const dataPackage of dataPackages) {
      try {
        await this.saveOneDataPackage(dataPackage);
      } catch (e) {
        this.logger.error(
          "Error occured while saving dataPackage to Bundlr",
          (e as Error).stack
        );
      }
    }
  }

  async saveOneDataPackage(dataPackage: CachedDataPackage) {
    const timestampSeconds = Math.round(
      dataPackage.timestampMilliseconds / 1000
    );
    const tagsObj = {
      type: REDSTONE_TYPE_TAG_VALUE,
      timestamp: timestampSeconds.toString(),
      dataServiceId: dataPackage.dataServiceId,
      signerAddress: dataPackage.signerAddress,
      dataFeedId: dataPackage.dataFeedId || "",
    };
    const tagsArray = Object.entries(tagsObj).map(([name, value]) => ({
      name,
      value,
    }));

    const dataToSave = BundlrBroadcaster.prepareDataToSave(dataPackage);

    const tx = this.bundlrClient!.createTransaction(dataToSave, {
      tags: tagsArray,
    });

    await tx.sign();
    this.logger.log(`Tx signed: ${tx.id}`);

    await tx.upload();
    this.logger.log(`Tx uploaded: ${tx.id}`);
  }

  // TOOD: maybe use gzip compression in future
  static prepareDataToSave(dataPackage: CachedDataPackage) {
    return JSON.stringify(dataPackage);
  }
}

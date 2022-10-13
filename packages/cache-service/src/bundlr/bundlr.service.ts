import { Injectable, Logger } from "@nestjs/common";
import { CachedDataPackage } from "../data-packages/data-packages.model";
import Bundlr from "@bundlr-network/client";
import config from "../config";

const REDSTONE_TYPE_TAG_VALUE = "redstone-oracles";

@Injectable()
export class BundlrService {
  private readonly logger = new Logger(BundlrService.name);
  private bundlrClient: Bundlr;

  constructor() {
    if (config.enableArchivingOnArweave) {
      this.bundlrClient = new Bundlr(
        config.bundlrNodeUrl,
        "arweave",
        config.arweaveJwkKey
      );
    }
  }

  async safelySaveDataPackages(dataPackages: CachedDataPackage[]) {
    try {
      await this.saveDataPackages(dataPackages);
    } catch (e) {
      this.logger.error("Error occured while saving to Bundlr", e.stack);
    }
  }

  async saveDataPackages(dataPackages: CachedDataPackage[]) {
    for (const dataPackage of dataPackages) {
      await this.saveOneDataPackage(dataPackage);
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

    const dataToSave = this.prepareDataToSave(dataPackage);

    const tx = await this.bundlrClient.createTransaction(dataToSave, {
      tags: tagsArray,
    });

    await tx.sign();
    this.logger.log(`Tx signed: ${tx.id}`);

    await tx.upload();
    this.logger.log(`Tx uploaded: ${tx.id}`);
  }

  // TOOD: maybe use gzip compression in future
  prepareDataToSave(dataPackage: CachedDataPackage) {
    return JSON.stringify(dataPackage);
  }
}

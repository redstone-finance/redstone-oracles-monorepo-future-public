import { Injectable, Logger } from "@nestjs/common";
import { CachedDataPackage } from "../data-packages/data-packages.model";
import Bundlr from "@bundlr-network/client";
import config from "../config";
import { DataPackagesBroadcaster } from "./data-packages-broadcaster";
import { RedstoneCommon } from "@redstone-finance/utils";

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

  // eslint-disable-next-line @typescript-eslint/require-await
  async broadcast(
    dataPackages: CachedDataPackage[],
    nodeEvmAddress: string
  ): Promise<void> {
    const message = `broadcast ${dataPackages.length} data packages for node ${nodeEvmAddress}`;

    for (const dataPackage of dataPackages) {
      this.saveOneDataPackage(dataPackage)
        .then(() =>
          this.logger.log(
            `[${BundlrBroadcaster.name}] succeeded to ${message}.`
          )
        )
        .catch((error) => {
          this.logger.error(
            `[${
              BundlrBroadcaster.name
            }] failed to ${message}. Error occured while saving dataPackage to Bundlr. ${RedstoneCommon.stringifyError(
              error
            )}`
          );
        });
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

import { DataPackagesResponse } from "@redstone-finance/sdk";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";
import { SignedDataPackage } from "@redstone-finance/protocol";

export class DataPackagesWrapper extends BaseWrapper {
  constructor(private dataPackages: DataPackagesResponse) {
    super();
  }

  getUnsignedMetadata(): string {
    const currentTimestamp = Date.now();
    return `${currentTimestamp}#${version}#data-packages-wrapper`;
  }

  override async getDataPackagesForPayload() {
    return Object.values(this.dataPackages).flat() as SignedDataPackage[];
  }
}

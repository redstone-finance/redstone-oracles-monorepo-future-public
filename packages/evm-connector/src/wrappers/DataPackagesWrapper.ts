import { DataPackagesResponse } from "@redstone-finance/sdk";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";
import { SignedDataPackage } from "@redstone-finance/protocol";
import { Contract } from "ethers";

export class DataPackagesWrapper<T extends Contract> extends BaseWrapper<T> {
  constructor(private dataPackages: DataPackagesResponse) {
    super();
  }

  override getUnsignedMetadata(): string {
    return `${this.getMetadataTimestamp()}#${version}#data-packages-wrapper`;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async getDataPackagesForPayload() {
    return Object.values(this.dataPackages).flat() as SignedDataPackage[];
  }
}

import { DataPackagesResponse } from "redstone-sdk";
import { RedstonePayload } from "redstone-protocol";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

export class DataPackagesWrapper extends BaseWrapper {
  constructor(private dataPackages: DataPackagesResponse) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#data-packages-wrapper`;
  }

  async getBytesDataForAppending(): Promise<string> {
    return this.getRedstonePayload();
  }

  getRedstonePayload() {
    const unsignedMetadataMsg = this.getUnsignedMetadata();
    const signedDataPackages = Object.values(this.dataPackages).flat();

    return RedstonePayload.prepare(
      signedDataPackages,
      unsignedMetadataMsg || ""
    );
  }
}

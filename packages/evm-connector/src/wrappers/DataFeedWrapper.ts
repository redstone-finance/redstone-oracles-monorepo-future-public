import { RedstonePayload } from "redstone-protocol";
import { DataPackagesRequestParams, requestDataPackages } from "redstone-sdk";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

export class DataFeedWrapper extends BaseWrapper {
  constructor(private dataPackagesRequestParams: DataPackagesRequestParams) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#${this.dataPackagesRequestParams.dataFeedId}`;
  }

  async getBytesDataForAppending(): Promise<string> {
    const unsignedMetadata = this.getUnsignedMetadata();
    const signedDataPackages = await requestDataPackages(
      this.dataPackagesRequestParams
    );
    return RedstonePayload.prepare(signedDataPackages, unsignedMetadata);
  }
}

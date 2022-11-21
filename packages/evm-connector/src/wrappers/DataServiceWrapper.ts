import {
  DataPackagesRequestParams,
  requestRedstonePayload,
} from "redstone-sdk";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

export class DataServiceWrapper extends BaseWrapper {
  constructor(
    private dataPackagesRequestParams: DataPackagesRequestParams,
    private urls?: string[]
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#${this.dataPackagesRequestParams.dataServiceId}`;
  }

  async getBytesDataForAppending(): Promise<string> {
    const unsignedMetadataMsg = this.getUnsignedMetadata();
    const redstonePayload = await requestRedstonePayload(
      this.dataPackagesRequestParams,
      this.urls,
      unsignedMetadataMsg
    );
    return redstonePayload;
  }
}

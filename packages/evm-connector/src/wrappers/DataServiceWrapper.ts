import { RedstonePayload, SignedDataPackage } from "redstone-protocol";
import {
  DataPackagesRequestParams,
  DataPackagesResponse,
  requestDataPackages,
} from "redstone-sdk";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

const parseDataPackagesResponse = (
  dataPackagesResponse: DataPackagesResponse
): SignedDataPackage[] => {
  const signedDataPackages: SignedDataPackage[] = [];
  for (const dpForDataFeed of Object.values(dataPackagesResponse)) {
    signedDataPackages.push(...dpForDataFeed);
  }
  return signedDataPackages;
};

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
    const unsignedMetadata = this.getUnsignedMetadata();
    const dataPackagesResponse = await requestDataPackages(
      this.dataPackagesRequestParams,
      this.urls
    );
    const signedDataPackages = parseDataPackagesResponse(dataPackagesResponse);
    return RedstonePayload.prepare(signedDataPackages, unsignedMetadata);
  }
}

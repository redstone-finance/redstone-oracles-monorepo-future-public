import { serializeSignedDataPackages } from "redstone-protocol";
import { DataPackagesRequestParams, requestDataPackages } from "redstone-sdk";
import { BaseWrapper } from "./BaseWrapper";

export class DataFeedWrapper extends BaseWrapper {
  constructor(private dataPackagesRequestParams: DataPackagesRequestParams) {
    super();
  }

  async getBytesDataForAppending(): Promise<string> {
    const signedDataPackages = await requestDataPackages(
      this.dataPackagesRequestParams
    );
    return serializeSignedDataPackages(signedDataPackages);
  }
}

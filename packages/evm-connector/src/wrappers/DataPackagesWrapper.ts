import { DataPackagesResponse } from "redstone-sdk";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

export class DataPackagesWrapper extends BaseWrapper {
  constructor(private dataPackages: DataPackagesResponse) {
    super();
  }

  getUnsignedMetadata(): string {
    const currentTimestamp = Date.now();
    return `${currentTimestamp}#${version}#data-packages-wrapper`;
  }

  async getDataPackagesForPayload() {
    return Object.values(this.dataPackages).flat();
  }
}

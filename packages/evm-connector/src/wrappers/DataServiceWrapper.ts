import {
  DataPackagesRequestParams,
  requestDataPackages,
} from "@redstone-finance/sdk";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";
import { resolveDataServiceUrls } from "@redstone-finance/sdk";
import { SignedDataPackage } from "@redstone-finance/protocol";

export type DataPackagesRequestInput = Partial<DataPackagesRequestParams>;

export class DataServiceWrapper extends BaseWrapper {
  constructor(
    private readonly dataPackagesRequestParams: DataPackagesRequestInput
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    const currentTimestamp = Date.now();
    return `${currentTimestamp}#${version}#${this.dataPackagesRequestParams.dataServiceId}`;
  }

  async getDataPackagesForPayload(): Promise<SignedDataPackage[]> {
    const dataPackagesRequestParams =
      await this.resolveDataPackagesRequestParams();
    const dpResponse = await requestDataPackages(dataPackagesRequestParams);
    return Object.values(dpResponse).flat();
  }

  private async resolveDataPackagesRequestParams(): Promise<
    Required<DataPackagesRequestInput>
  > {
    const fetchedParams = {
      ...this.dataPackagesRequestParams,
    } as Required<DataPackagesRequestInput>;

    if (!this.dataPackagesRequestParams.uniqueSignersCount) {
      fetchedParams.uniqueSignersCount =
        await this.getUniqueSignersThresholdFromContract();
    }

    if (!this.dataPackagesRequestParams.dataServiceId) {
      fetchedParams.dataServiceId = await this.getDataServiceIdFromContract();
    }

    if (!this.dataPackagesRequestParams.urls) {
      fetchedParams.urls = resolveDataServiceUrls(
        fetchedParams.dataServiceId ??
          this.dataPackagesRequestParams.dataServiceId
      );
    }

    return fetchedParams;
  }

  private async getDataServiceIdFromContract(): Promise<string> {
    try {
      const dataServiceId = await this.contract.getDataServiceId();
      return dataServiceId;
    } catch (e: any) {
      throw new Error(
        `DataServiceId not provided and failed to get it from underlying contract. Error: ` +
          e?.message
      );
    }
  }

  private async getUniqueSignersThresholdFromContract(): Promise<number> {
    try {
      return await this.contract.getUniqueSignersThreshold();
    } catch (e: any) {
      throw new Error(
        `UniqueSignersCount not provided and failed to get it from underlying contract. Error: ` +
          e?.message
      );
    }
  }
}

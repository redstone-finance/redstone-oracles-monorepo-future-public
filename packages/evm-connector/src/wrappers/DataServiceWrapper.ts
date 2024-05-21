import { SignedDataPackage } from "@redstone-finance/protocol";
import {
  DataPackagesRequestParams,
  requestDataPackages,
  resolveDataServiceUrls,
} from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import { Contract } from "ethers";
import { version } from "../../package.json";
import { BaseWrapper } from "./BaseWrapper";

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type DataPackagesRequestInput = WithRequired<
  Partial<DataPackagesRequestParams>,
  "dataPackagesIds"
>;

export class DataServiceWrapper<T extends Contract> extends BaseWrapper<T> {
  constructor(
    private readonly dataPackagesRequestParams: DataPackagesRequestInput
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${this.getMetadataTimestamp()}#${version}#${
      this.dataPackagesRequestParams.dataServiceId
    }`;
  }

  async getDataPackagesForPayload(): Promise<SignedDataPackage[]> {
    const dataPackagesRequestParams =
      await this.resolveDataPackagesRequestParams();
    const dpResponse = await requestDataPackages(dataPackagesRequestParams);
    return Object.values(dpResponse).flat() as SignedDataPackage[];
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
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        fetchedParams.dataServiceId ??
          this.dataPackagesRequestParams.dataServiceId
      );
    }

    return fetchedParams;
  }

  private async getDataServiceIdFromContract(): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const dataServiceId = (await this.contract.getDataServiceId()) as string;
      return dataServiceId;
    } catch (e) {
      throw new Error(
        `DataServiceId not provided and failed to get it from underlying contract. Error: ` +
          RedstoneCommon.stringifyError(e)
      );
    }
  }

  private async getUniqueSignersThresholdFromContract(): Promise<number> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return (await this.contract.getUniqueSignersThreshold()) as number;
    } catch (e) {
      throw new Error(
        `UniqueSignersCount not provided and failed to get it from underlying contract. Error: ` +
          RedstoneCommon.stringifyError(e)
      );
    }
  }
}

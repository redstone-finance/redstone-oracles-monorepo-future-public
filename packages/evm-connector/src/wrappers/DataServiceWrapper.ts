import {
  DataPackagesRequestParams,
  requestDataPackages,
  requestRedstonePayload,
} from "redstone-sdk";
import { BaseWrapper, ParamsForDryRunVerification } from "./BaseWrapper";
import { parseAggregatedErrors } from "../helpers/parse-aggregated-errors";
import { runDryRun } from "../helpers/run-dry-run";
import { version } from "../../package.json";
import { resolveDataServiceUrls } from "redstone-sdk";
import { SignedDataPackage } from "redstone-protocol";

export interface DryRunParamsWithUnsignedMetadata
  extends ParamsForDryRunVerification {
  unsignedMetadataMsg: string;
  dataPackagesRequestParams: Required<DataPackagesRequestInput>;
}

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

  // Currently, we do not support preparing a manual payload in the
  // DataServiceWrapper, as it would complicate the code too much
  getDataPackagesForPayload(): Promise<SignedDataPackage[]> {
    throw new Error(
      `getDataPackagesForPayload is not supported by DataServiceWrapper`
    );
  }
  getRedstonePayloadForManualUsage(): Promise<string> {
    throw new Error(
      `getRedstonePayloadForManualUsage is not supported by DataServiceWrapper`
    );
  }

  async getBytesDataForAppending(
    dryRunParams: ParamsForDryRunVerification
  ): Promise<string> {
    const unsignedMetadataMsg = this.getUnsignedMetadata();
    const disablePayloadsDryRun = Boolean(
      this.dataPackagesRequestParams.disablePayloadsDryRun
    );

    const dataPackagesRequestParams =
      await this.resolveDataPackagesRequestParams();

    if (disablePayloadsDryRun) {
      return this.requestPayloadWithoutDryRun(
        dataPackagesRequestParams,
        unsignedMetadataMsg
      );
    }

    return this.requestPayloadWithDryRun({
      unsignedMetadataMsg,
      dataPackagesRequestParams,
      ...dryRunParams,
    });
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

  /* 
    Call function on provider always returns some result and doesn't throw an error.
    Later we need to decode the result from the call (decodeFunctionResult) and
    this function will throw an error if the call was reverted.
  */
  async requestPayloadWithDryRun({
    unsignedMetadataMsg,
    dataPackagesRequestParams: input,
    ...dryRunParams
  }: DryRunParamsWithUnsignedMetadata) {
    const promises = input.urls.map(async (url) => {
      const redstonePayload = await this.requestPayloadWithoutDryRun(
        {
          ...input,
          urls: [url],
        },
        unsignedMetadataMsg
      );
      await runDryRun({ ...dryRunParams, redstonePayload });
      return redstonePayload;
    });
    return Promise.any(promises).catch((error: any) => {
      const parsedErrors = parseAggregatedErrors(error);
      throw new Error(
        `All redstone payloads do not pass dry run verification, aggregated errors: ${parsedErrors}`
      );
    });
  }

  async requestPayloadWithoutDryRun(
    dataPackagesRequestParams: Required<DataPackagesRequestInput>,
    unsignedMetadataMsg: string
  ) {
    return requestRedstonePayload(
      dataPackagesRequestParams,
      unsignedMetadataMsg
    );
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

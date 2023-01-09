import {
  DataPackagesRequestParams,
  requestRedstonePayload,
} from "redstone-sdk";
import { BaseWrapper, ParamsForDryRunVerification } from "./BaseWrapper";
import { version } from "../../package.json";
import { parseAggregatedErrors } from "../helpers/parse-aggregated-errors";

interface RequestPayloadWithDryRunParams extends ParamsForDryRunVerification {
  unsignedMetadataMsg: string;
}

export class DataServiceWrapper extends BaseWrapper {
  constructor(
    private dataPackagesRequestParams: DataPackagesRequestParams,
    private urls: string[]
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#${this.dataPackagesRequestParams.dataServiceId}`;
  }

  async getBytesDataForAppending(
    params: ParamsForDryRunVerification
  ): Promise<string> {
    const unsignedMetadataMsg = this.getUnsignedMetadata();
    const disablePayloadsDryRun = Boolean(
      this.dataPackagesRequestParams.disablePayloadsDryRun
    );
    if (disablePayloadsDryRun) {
      return this.requestPayloadWithoutDryRun(this.urls, unsignedMetadataMsg);
    }
    return this.requestPayloadWithDryRun({ ...params, unsignedMetadataMsg });
  }

  /* 
    Call function on provider always returns some result and doesn't throw an error.
    Later we need to decode the result from the call (decodeFunctionResult) and
    this function will throw an error if the call was reverted.
  */
  async requestPayloadWithDryRun({
    functionName,
    contract,
    transaction,
    unsignedMetadataMsg,
  }: RequestPayloadWithDryRunParams) {
    const promises = this.urls.map(async (url) => {
      const transactionToTest = Object.assign({}, transaction);
      const redstonePayload = await this.requestPayloadWithoutDryRun(
        [url],
        unsignedMetadataMsg
      );
      transactionToTest.data = transactionToTest.data + redstonePayload;
      const result = await contract.provider.call(transactionToTest);
      contract.interface.decodeFunctionResult(functionName, result);
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
    urls: string[],
    unsignedMetadataMsg: string
  ) {
    return requestRedstonePayload(
      this.dataPackagesRequestParams,
      urls,
      unsignedMetadataMsg
    );
  }
}

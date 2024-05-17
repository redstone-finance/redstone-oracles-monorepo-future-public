import { hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";
import { arrayify } from "ethers/lib/utils";
import { DataPackagesRequestParams, requestRedstonePayload } from "../index";

export class ContractParamsProvider {
  constructor(public readonly requestParams: DataPackagesRequestParams) {}

  async getPayloadHex(withPrefix = true): Promise<string> {
    return (
      (withPrefix ? "0x" : "") + (await this.requestPayload(this.requestParams))
    );
  }

  async getPayloadData(): Promise<number[]> {
    return Array.from(arrayify(await this.getPayloadHex(true)));
  }

  getHexlifiedFeedIds(): string[] {
    return this.getDataFeedIds().map((feed) => hexlify(toUtf8Bytes(feed)));
  }

  getDataFeedIds(): string[] {
    return this.requestParams.dataPackagesIds;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected async requestPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<string> {
    return await requestRedstonePayload(requestParams);
  }
}

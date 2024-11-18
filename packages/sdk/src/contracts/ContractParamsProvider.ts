import { hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";
import { arrayify } from "ethers/lib/utils";
import {
  convertDataPackagesResponse,
  DataPackagesRequestParams,
  DataPackagesResponseCache,
  requestDataPackages,
} from "../index";

export class ContractParamsProvider {
  constructor(
    public readonly requestParams: DataPackagesRequestParams,
    private readonly cache?: DataPackagesResponseCache,
    private readonly overrideRequestParamsPackagesIds?: string[]
  ) {}

  async getPayloadHex(withPrefix = true): Promise<string> {
    return (withPrefix ? "0x" : "") + (await this.requestPayload());
  }

  async getPayloadData(): Promise<number[]> {
    return Array.from(arrayify(await this.getPayloadHex(true)));
  }

  getHexlifiedFeedIds(): string[] {
    return this.getDataFeedIds().map((feed) => hexlify(toUtf8Bytes(feed)));
  }

  getDataFeedIds(): string[] {
    return (
      this.overrideRequestParamsPackagesIds ??
      this.requestParams.dataPackagesIds
    );
  }

  async requestDataPackages() {
    const cachedResponse = this.cache?.get(this.requestParams);
    if (cachedResponse) {
      return cachedResponse;
    }

    return await requestDataPackages(this.requestParams);
  }

  protected async requestPayload(): Promise<string> {
    return convertDataPackagesResponse(await this.requestDataPackages());
  }
}

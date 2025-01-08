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

  static hexlifyFeedIds(feedIds: string[]) {
    return feedIds.map((feed) => hexlify(toUtf8Bytes(feed)));
  }

  async getPayloadHex(withPrefix = true): Promise<string> {
    return (withPrefix ? "0x" : "") + (await this.requestPayload());
  }

  async getPayloadData(): Promise<number[]> {
    return Array.from(arrayify(await this.getPayloadHex(true)));
  }

  getHexlifiedFeedIds(): string[] {
    return ContractParamsProvider.hexlifyFeedIds(this.getDataFeedIds());
  }

  getDataFeedIds(): string[] {
    return (
      this.overrideRequestParamsPackagesIds ??
      this.requestParams.dataPackagesIds
    );
  }

  async requestDataPackages(canUpdateCache = false) {
    const cachedResponse = this.cache?.get(this.requestParams, !canUpdateCache);
    if (cachedResponse) {
      return cachedResponse;
    }

    const dataPackagesResponse = await this.performRequestingDataPackages();

    if (canUpdateCache) {
      this.cache?.update(dataPackagesResponse, this.requestParams);
    }

    return dataPackagesResponse;
  }

  protected async performRequestingDataPackages() {
    return await requestDataPackages(this.requestParams);
  }

  protected async requestPayload(): Promise<string> {
    return convertDataPackagesResponse(await this.requestDataPackages());
  }
}

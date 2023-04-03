import { BigNumberish } from "ethers";
import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";
import { hexlify } from "@ethersproject/bytes";
import { arrayify } from "ethers/lib/utils";

import {
  DataPackagesRequestParams,
  DEFAULT_CACHE_SERVICE_URLS,
  requestRedstonePayload,
} from "../index";

export class ContractParamsProvider {
  constructor(
    public readonly requestParams: DataPackagesRequestParams,
    public readonly urls: string[] = DEFAULT_CACHE_SERVICE_URLS
  ) {}

  async getPayloadData(): Promise<number[]> {
    const payloadHex = await this.requestPayload(this.requestParams);

    return Array.from(arrayify(payloadHex));
  }

  getHexlifiedFeedIds(): BigNumberish[] {
    return this.getDataFeedIds().map((feed) => hexlify(toUtf8Bytes(feed)));
  }

  private getDataFeedIds(): string[] {
    if (!this.requestParams.dataFeeds) {
      throw new Error("That invocation requires non-empty dataFeeds");
    }

    return this.requestParams.dataFeeds;
  }

  protected async requestPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<string> {
    return "0x" + (await requestRedstonePayload(requestParams, this.urls));
  }
}

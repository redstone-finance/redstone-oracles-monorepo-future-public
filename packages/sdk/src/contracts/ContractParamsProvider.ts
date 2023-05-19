import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";
import { hexlify } from "@ethersproject/bytes";
import { arrayify } from "ethers/lib/utils";

import {
  DataPackagesRequestParams,
  getUrlsForDataServiceId,
  requestRedstonePayload,
} from "../index";

export class ContractParamsProvider {
  constructor(
    public readonly requestParams: DataPackagesRequestParams,
    urls: string[]
  ) {
    if (!urls) {
      requestParams.urls = getUrlsForDataServiceId(requestParams);
    }
  }

  async getPayloadData(): Promise<number[]> {
    const payloadHex = await this.requestPayload(this.requestParams);

    return Array.from(arrayify(payloadHex));
  }

  getHexlifiedFeedIds(): string[] {
    return this.getDataFeedIds().map((feed) => hexlify(toUtf8Bytes(feed)));
  }

  protected getDataFeedIds(): string[] {
    if (!this.requestParams.dataFeeds) {
      throw new Error("That invocation requires non-empty dataFeeds");
    }

    return this.requestParams.dataFeeds;
  }

  protected async requestPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<string> {
    return "0x" + (await requestRedstonePayload(requestParams));
  }
}

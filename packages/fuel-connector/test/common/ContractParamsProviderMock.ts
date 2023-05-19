import {
  ContractParamsProvider,
  DataPackagesRequestParams,
} from "redstone-sdk";
import fs from "fs";
import path from "path";
import { hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";

export class ContractParamsProviderMock extends ContractParamsProvider {
  overriddenFeedIds?: string[];

  constructor(private filename: string, dataFeeds: string[]) {
    super({ uniqueSignersCount: 0, dataServiceId: "", dataFeeds });
  }

  protected async requestPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<string> {
    return fs
      .readFileSync(path.join(__dirname, `../sample-data/${this.filename}.hex`))
      .toString();
  }

  override getHexlifiedFeedIds(): string[] {
    return (
      this.overriddenFeedIds?.map((feed) => hexlify(toUtf8Bytes(feed))) ||
      super.getHexlifiedFeedIds()
    );
  }
}

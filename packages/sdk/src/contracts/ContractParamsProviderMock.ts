import fs from "fs";
import { hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";
import { ContractParamsProvider } from "./ContractParamsProvider";
import { DataPackagesRequestParams } from "../index";

export class ContractParamsProviderMock extends ContractParamsProvider {
  overriddenFeedIds?: string[];

  constructor(private filePath: string, dataFeeds: string[]) {
    super({ uniqueSignersCount: 0, dataServiceId: "", dataFeeds });
  }

  protected requestPayload(_: DataPackagesRequestParams): Promise<string> {
    return Promise.resolve(fs.readFileSync(this.filePath).toString());
  }

  override getHexlifiedFeedIds(): string[] {
    return (
      this.overriddenFeedIds?.map((feed) => hexlify(toUtf8Bytes(feed))) ||
      super.getHexlifiedFeedIds()
    );
  }
}

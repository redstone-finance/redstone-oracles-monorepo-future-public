import { hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings/lib/utf8";
import { DataPackagesRequestParams } from "../index";
import { ContractParamsProvider } from "./ContractParamsProvider";

export class ContractParamsProviderMock extends ContractParamsProvider {
  overriddenFeedIds?: string[];

  constructor(
    dataFeeds: string[],
    private filePath: string,
    private fileReader: (filePath: string) => Buffer,
    uniqueSignersCount = 0
  ) {
    super({
      uniqueSignersCount,
      dataServiceId: "",
      dataPackagesIds: dataFeeds,
    });
  }

  protected override requestPayload(
    _: DataPackagesRequestParams
  ): Promise<string> {
    return Promise.resolve(this.fileReader(this.filePath).toString());
  }

  override getHexlifiedFeedIds(): string[] {
    return (
      this.overriddenFeedIds?.map((feed) => hexlify(toUtf8Bytes(feed))) ||
      super.getHexlifiedFeedIds()
    );
  }
}

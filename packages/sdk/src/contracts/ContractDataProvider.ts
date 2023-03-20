import { BigNumberish } from "ethers";
import {
  DataPackagesRequestParams,
  DEFAULT_CACHE_SERVICE_URLS,
  requestRedstonePayload,
} from "../index";

export type DataFeedId = keyof DataFeedIdNumber;

type DataFeedIdNumber = {
  BTC: number,
  ETH: number,
  BNB: number,
  AR: number,
  AVAX: number,
  CELO: number,
};

export class ContractDataProvider {
  private static dataFeedIdNumber = {
    BTC: 4346947, // 256*256*ord('B') + 256*ord('T') + ord('C')
    ETH: 4543560,
    BNB: 4345410,
    AR: 16722,
    AVAX: 1096171864,
    CELO: 1128614991,
  };

  constructor(
    private requestParams: DataPackagesRequestParams,
    private urls: string[] = DEFAULT_CACHE_SERVICE_URLS
  ) {}

  async getPayloadData(): Promise<string> {
    this.getDataFeedIds();

    const payload = await requestRedstonePayload(this.requestParams, this.urls);

    return `0x` + payload;
  }

  async getDataFeedNumbers(): Promise<BigNumberish[]> {
    return this.getDataFeedIds().map(
      (dataFeedId) => ContractDataProvider.dataFeedIdNumber[dataFeedId]
    );
  }

  getDataFeedIds(): DataFeedId[] {
    if (!this.requestParams.dataFeeds) {
      throw new Error("That invocation requires non-empty dataFeeds");
    }

    return this.requestParams.dataFeeds as DataFeedId[];
  }

  static splitPayloadData(payloadHex: string): any {
    payloadHex = payloadHex.startsWith("0x") ? payloadHex : `0x${payloadHex}`;

    const payloadData = [];
    for (let i = 2; i < payloadHex.length - 1; i++) {
      if (i % 2 == 1) {
        continue;
      }
      payloadData[i / 2 - 1] = `0x${payloadHex[i]}${payloadHex[i + 1]}`;
    }

    return payloadData;
  }
}

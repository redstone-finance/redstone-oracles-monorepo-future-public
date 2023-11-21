import { Cell } from "ton-core";
import { compile } from "@ton-community/blueprint";
import "@ton-community/test-utils";
import {
  createTestNetwork,
  expectUsdtPrice,
  getContractParamsProvider,
  SIGNERS,
  waitForNewData,
} from "./helpers/test_helpers";
import { TonSingleFeedManContractAdapter } from "../src/single-feed-man/TonSingleFeedManContractAdapter";
import { TonSingleFeedManContractDeployer } from "../src/single-feed-man/TonSingleFeedManContractDeployer";
import { SingleFeedManInitData } from "../src/single-feed-man/SingleFeedManInitData";

jest.setTimeout(40000);

describe("Ton Single Feed Man Tests", () => {
  let singleFeedManCode: Cell;
  let singleFeedMan: TonSingleFeedManContractAdapter;

  beforeAll(async () => {
    singleFeedManCode = await compile("single_feed_man");
  });

  beforeEach(async () => {
    const network = await createTestNetwork();

    singleFeedMan = await new TonSingleFeedManContractDeployer(
      network,
      singleFeedManCode,
      new SingleFeedManInitData("USDT", 1, SIGNERS)
    ).getAdapter();
  });

  it("should deploy & not set any initial data", async () => {
    const { price, timestamp } =
      await singleFeedMan.readPriceAndTimestampFromContract();

    expect(price).toBe(0n);
    expect(timestamp).toBe(0);
  });

  it("should get price", async () => {
    const paramsProvider = getContractParamsProvider();

    const { price, timestamp } =
      await singleFeedMan.getPriceFromPayload(paramsProvider);

    expect(timestamp).toBeGreaterThan(0);
    expectUsdtPrice(price);
  });

  it("should write and read price", async () => {
    const { price, timestamp } = await writeAndReadPriceAndTimestamp();

    expect(timestamp).toBeGreaterThan(0);
    expectUsdtPrice(price);
  });

  it("should write prices twice", async () => {
    const { price, timestamp } = await writeAndReadPriceAndTimestamp([
      "USDT",
      "ETH",
    ]);

    expect(timestamp).toBeGreaterThan(0);
    expectUsdtPrice(price);

    await waitForNewData();

    const { price: price2, timestamp: timestamp2 } =
      await writeAndReadPriceAndTimestamp();

    expect(timestamp2).not.toBe(timestamp);
    expect(price2).not.toBe(price);
  });

  async function writeAndReadPriceAndTimestamp(
    dataFeeds: string[] = ["ETH", "BTC", "AVAX", "USDT"]
  ) {
    const paramsProvider = getContractParamsProvider(dataFeeds);

    await singleFeedMan.writePriceFromPayloadToContract(paramsProvider);
    const { price, timestamp } =
      await singleFeedMan.readPriceAndTimestampFromContract();

    return { price, timestamp, paramsProvider };
  }
});

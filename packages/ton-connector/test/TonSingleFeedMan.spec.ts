import { compile } from "@ton/blueprint";
import { Cell } from "@ton/core";
import "@ton/test-utils";
import { SampleConsumerInitData } from "../src/sample-consumer/SampleConsumerInitData";
import { TonSampleConsumerContractAdapter } from "../src/sample-consumer/TonSampleConsumerContractAdapter";
import { TonSampleConsumerContractDeployer } from "../src/sample-consumer/TonSampleConsumerContractDeployer";
import { SingleFeedManInitData } from "../src/single-feed-man/SingleFeedManInitData";
import { TonSingleFeedManContractAdapter } from "../src/single-feed-man/TonSingleFeedManContractAdapter";
import { TonSingleFeedManContractDeployer } from "../src/single-feed-man/TonSingleFeedManContractDeployer";
import { toBigInt } from "../src/ton-utils";
import {
  createTestNetwork,
  extractSandboxLogs,
} from "./helpers/sandbox_helpers";
import {
  expectUsdtPrice,
  getContractParamsProvider,
  SIGNERS,
  waitForNewPayload,
} from "./helpers/test_helpers";

jest.setTimeout(60000);

describe("Ton Single Feed Man Tests", () => {
  let singleFeedManCode: Cell;
  let sampleConsumerCode: Cell;
  let singleFeedMan: TonSingleFeedManContractAdapter;
  let sampleConsumer: TonSampleConsumerContractAdapter;

  beforeAll(async () => {
    singleFeedManCode = await compile("single_feed_man");
    sampleConsumerCode = await compile("sample_consumer");
  });

  beforeEach(async () => {
    await initialize("USDT");
  });

  async function initialize(feedId: string) {
    const network = await createTestNetwork();

    singleFeedMan = await new TonSingleFeedManContractDeployer(
      network,
      singleFeedManCode,
      new SingleFeedManInitData(feedId, 1, SIGNERS)
    ).getAdapter();

    sampleConsumer = await new TonSampleConsumerContractDeployer(
      network,
      sampleConsumerCode,
      new SampleConsumerInitData(singleFeedMan.contract.address.toString())
    ).getAdapter();
  }

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

    const consumerLogs = extractSandboxLogs(await sampleConsumer.readData(), 3);

    expect(BigInt(consumerLogs[0])).toBe(toBigInt("USDT"));
    expect(BigInt(consumerLogs[1])).toBe(price);
    expect(Number(consumerLogs[2])).toBe(timestamp);
  });

  it("should write prices twice", async () => {
    await initialize("ETH");
    const { price, timestamp, paramsProvider } =
      await writeAndReadPriceAndTimestamp(["ETH"]);

    expect(timestamp).toBeGreaterThan(0);

    await waitForNewPayload(paramsProvider, timestamp, Number(price));

    const { price: price2, timestamp: timestamp2 } =
      await writeAndReadPriceAndTimestamp();

    expect(timestamp2).not.toBe(timestamp);
    expect(price2).not.toBe(price);
    expect(price2).not.toBe(0);
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

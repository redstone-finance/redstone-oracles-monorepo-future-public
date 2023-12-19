import { Cell } from "@ton/core";
import { compile } from "@ton/blueprint";
import "@ton/test-utils";
import { TonPriceFeedContractAdapter } from "../src";
import { TonPriceManagerContractAdapter } from "../src/price-manager/TonPriceManagerContractAdapter";
import { PriceFeedInitData } from "../src/price-feed/PriceFeedInitData";
import { PriceManagerInitData } from "../src/price-manager/PriceManagerInitData";
import { TonPriceFeedContractDeployer } from "../src/price-feed/TonPriceFeedContractDeployer";
import { TonPriceManagerContractDeployer } from "../src/price-manager/TonPriceManagerContractDeployer";
import { TonSampleConsumerContractAdapter } from "../src/sample-consumer/TonSampleConsumerContractAdapter";
import {
  expectUsdtPrice,
  getContractParamsProvider,
  SIGNERS,
  waitForNewData,
} from "./helpers/test_helpers";
import { TonSampleConsumerContractDeployer } from "../src/sample-consumer/TonSampleConsumerContractDeployer";
import { SampleConsumerInitData } from "../src/sample-consumer/SampleConsumerInitData";
import {
  createTestNetwork,
  extractSandboxLogs,
} from "./helpers/sandbox_helpers";
import { toBigInt } from "../src/ton-utils";

jest.setTimeout(40000);

describe("Ton Prices Tests", () => {
  let priceManagerCode: Cell;
  let priceFeedCode: Cell;
  let sampleConsumerCode: Cell;
  let priceManager: TonPriceManagerContractAdapter;
  let pricesFeed: TonPriceFeedContractAdapter;
  let sampleConsumer: TonSampleConsumerContractAdapter;

  beforeAll(async () => {
    priceManagerCode = await compile("price_manager");
    priceFeedCode = await compile("price_feed");
    sampleConsumerCode = await compile("sample_consumer");
  });

  beforeEach(async () => {
    const network = await createTestNetwork();

    priceManager = await new TonPriceManagerContractDeployer(
      network,
      priceManagerCode,
      new PriceManagerInitData(1, SIGNERS)
    ).getAdapter();

    pricesFeed = await new TonPriceFeedContractDeployer(
      network,
      priceFeedCode,
      new PriceFeedInitData("BTC", priceManager.contract.address.toString())
    ).getAdapter();

    sampleConsumer = await new TonSampleConsumerContractDeployer(
      network,
      sampleConsumerCode,
      new SampleConsumerInitData(pricesFeed.contract.address.toString())
    ).getAdapter();
  });

  it("should deploy & not set any initial data", async () => {
    const priceFeedInitialData = await pricesFeed.getData();
    expect(priceFeedInitialData).toStrictEqual({ timestamp: 0, value: 0n });

    const priceManagerInitialTimestamp =
      await priceManager.readTimestampFromContract();
    expect(priceManagerInitialTimestamp).toBe(0);
  });

  it("should get prices", async () => {
    const paramsProvider = getContractParamsProvider();

    const prices = await priceManager.getPricesFromPayload(paramsProvider);
    console.log(prices);

    expect(prices).not.toContain(0n);
    expectUsdtPrice(prices[3]);
  });

  it("should write and read prices", async () => {
    const { prices, timestamp } = await writeAndReadPricesAndTimestamp();

    await pricesFeed.fetchData();
    const feedData = await pricesFeed.getData();
    console.log(feedData);

    expect(feedData.value).toBe(prices[1]);
    expect(feedData.timestamp).toBe(timestamp);

    const consumerLogs = extractSandboxLogs(await sampleConsumer.readData(), 3);

    expect(BigInt(consumerLogs[0])).toBe(toBigInt("BTC"));
    expect(BigInt(consumerLogs[1])).toBe(prices[1]);
    expect(Number(consumerLogs[2])).toBe(timestamp);
  });

  it("must not write prices with same timestamp", async () => {
    const { prices, timestamp, paramsProvider } =
      await writeAndReadPricesAndTimestamp(["BTC", "ETH"]);

    expect(timestamp).toBeGreaterThan(0n);
    expect(prices).not.toContain(0n);

    const { prices: prices2, timestamp: timestamp2 } =
      await writeAndReadPricesAndTimestamp(["AVAX", "USDT"]);

    const prices3 = await priceManager.readPricesFromContract(paramsProvider);

    if (timestamp2 == timestamp) {
      expect(prices2).toStrictEqual([0n, 0n]);
      expect(prices3).toStrictEqual(prices);
    } else {
      expect(prices2).not.toContain(0n);
      expect(prices3).not.toStrictEqual(prices);
    }
  });

  it("should write prices twice", async () => {
    const { prices, timestamp } = await writeAndReadPricesAndTimestamp([
      "BTC",
      "ETH",
    ]);

    expect(timestamp).toBeGreaterThan(0);
    expect(prices).not.toContain(0n);

    await waitForNewData();

    const { prices: prices2, timestamp: timestamp2 } =
      await writeAndReadPricesAndTimestamp();

    expect(timestamp2).not.toBe(timestamp);
    expect(prices2[0] != prices[0] || prices2[1] != prices[1]).toBeTruthy();

    expect(prices2[2]).not.toBe(0n);
    expectUsdtPrice(prices2[3]);
  });

  async function writeAndReadPricesAndTimestamp(
    dataFeeds: string[] = ["ETH", "BTC", "AVAX", "USDT"]
  ) {
    const paramsProvider = getContractParamsProvider(dataFeeds);

    await priceManager.writePricesFromPayloadToContract(paramsProvider);
    const prices = await priceManager.readPricesFromContract(paramsProvider);
    console.log(prices);

    const timestamp = await priceManager.readTimestampFromContract();
    console.log(timestamp);

    return { prices, timestamp, paramsProvider };
  }
});

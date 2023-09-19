import { Blockchain } from "@ton-community/sandbox";
import { Cell } from "ton-core";
import { compile } from "@ton-community/blueprint";
import "@ton-community/test-utils";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { TonPriceFeedContractAdapter } from "../src";
import { TonPriceManagerContractAdapter } from "../src/price-manager/TonPriceManagerContractAdapter";
import { PriceFeedInitData } from "../src/price-feed/PriceFeedInitData";
import { PriceManagerInitData } from "../src/price-manager/PriceManagerInitData";

import { TestTonNetwork } from "./helpers/TestTonNetwork";
import { TonPriceFeedContractDeployer } from "../src/price-feed/TonPriceFeedContractDeployer";
import { TonPriceManagerContractDeployer } from "../src/price-manager/TonPriceManagerContractDeployer";

jest.setTimeout(10000);

export const SIGNERS = [
  "0x109B4A318A4F5DDCBCA6349B45F881B4137DEAFB",
  "0x12470F7ABA85C8B81D63137DD5925D6EE114952B",
  "0x1EA62D73EDF8AC05DFCEA1A34B9796E937A29EFF",
  "0x2C59617248994D12816EE1FA77CE0A64EEB456BF",
  "0x83CBA8C619FB629B81A65C2E67FE15CF3E3C9747",
];

describe("Ton Prices Tests", () => {
  let priceManagerCode: Cell;
  let priceFeedCode: Cell;
  let blockchain: Blockchain;
  let priceManager: TonPriceManagerContractAdapter;
  let pricesFeed: TonPriceFeedContractAdapter;

  beforeAll(async () => {
    priceManagerCode = await compile("price_manager");
    priceFeedCode = await compile("price_feed");
  });

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    const deployer = await blockchain.treasury("deployer");
    const network = new TestTonNetwork(blockchain, deployer);

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
  });

  it("should deploy & not set any initial data", async () => {
    const priceFeedInitialData = await pricesFeed.getData();
    expect(priceFeedInitialData).toStrictEqual({ timestamp: 0, value: 0n });

    const priceManagerInitialTimestamp =
      await priceManager.readTimestampFromContract();
    expect(priceManagerInitialTimestamp).toBe(0);
  });

  it("should get prices", async () => {
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 4,
      dataFeeds: ["ETH", "BTC", "AVAX", "USDT"],
    });

    const prices = await priceManager.getPricesFromPayload(paramsProvider);
    console.log(prices);

    expect(prices).not.toContain(0n);
    expect(Number(prices[3])).toBeLessThanOrEqual(10 ** 8 * 1.02);
    expect(Number(prices[3])).toBeGreaterThanOrEqual(10 ** 8 * 0.98);
  });

  it("should write and read prices", async () => {
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 4,
      dataFeeds: ["ETH", "BTC", "AVAX", "USDT"],
    });

    await priceManager.writePricesFromPayloadToContract(paramsProvider);
    const prices = await priceManager.readPricesFromContract(paramsProvider);
    console.log(prices);
    const timestamp = await priceManager.readTimestampFromContract();
    console.log(timestamp);

    await pricesFeed.fetchData();
    const feedData = await pricesFeed.getData();
    console.log(feedData);

    expect(feedData.value).toBe(prices[1]);
    expect(feedData.timestamp).toBe(timestamp);
  });
});

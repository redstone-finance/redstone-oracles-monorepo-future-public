import { ContractParamsProvider } from "@redstone-finance/sdk";
import "dotenv/config";
import redstone from "redstone-api";
import { PriceAdapterRadixContractConnector, RadixClient } from "../src";
import { IS_CI, loadAddress, PRIVATE_KEY } from "./scripts/constants";

jest.setTimeout(10 * 60000);
jest.unmock("@radixdlt/babylon-gateway-api-sdk");

describe("Integrated and initialized prices contract", () => {
  it("write_prices should write the price data that can be read then", async () => {
    if (IS_CI) {
      return console.log("Skipping in CI env");
    }

    const client = new RadixClient(PRIVATE_KEY);
    const connector = new PriceAdapterRadixContractConnector(
      client,
      await loadAddress("component.stokenet.addr")
    );

    const adapter = await connector.getAdapter();
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: 2,
      dataPackagesIds: ["ETH", "BTC"],
    });

    await adapter.writePricesFromPayloadToContract(paramsProvider);
    const prices = (await adapter.readPricesFromContract(paramsProvider)).map(
      Number
    );
    const timestamp = await adapter.readTimestampFromContract();

    const localTimestamp = Date.now();

    const TEN_MINUTES = 1000 * 60 * 10;
    expect(timestamp).toBeLessThan(localTimestamp + TEN_MINUTES);
    expect(timestamp).toBeGreaterThan(localTimestamp - TEN_MINUTES);

    const CHANGE_FACTOR = 0.1;

    const baseEthPrice = (await redstone.getPrice("ETH")).value * 10 ** 8;
    const baseBtcPrice = (await redstone.getPrice("BTC")).value * 10 ** 8;
    expect(prices[0]).toBeLessThan(baseEthPrice * (1 + CHANGE_FACTOR));
    expect(prices[0]).toBeGreaterThan(baseEthPrice * (1 - CHANGE_FACTOR));
    expect(prices[1]).toBeLessThan(baseBtcPrice * (1 + CHANGE_FACTOR));
    expect(prices[1]).toBeGreaterThan(baseBtcPrice * (1 - CHANGE_FACTOR));
  });
});

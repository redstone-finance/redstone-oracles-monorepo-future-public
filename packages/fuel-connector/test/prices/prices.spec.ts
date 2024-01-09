import {
  ContractParamsProvider,
  ContractParamsProviderMock,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { BigNumberish } from "ethers";
import * as fs from "fs";
import path from "path";
import {
  SAMPLE_PACKAGES_TIMESTAMP,
  deployPricesContract,
} from "./prices-contract-test-utils";

jest.setTimeout(120000);

describe("Prices contract", () => {
  it("read_timestamp should return 0 initially", async () => {
    const adapter = await deployPricesContract();
    const result = await adapter.readTimestampFromContract();

    expect(result).toBe(0);
  });

  const createContractParamsProviderMock = (
    dataFeeds: string[],
    filename: string = "2sig_ETH_BTC"
  ) => {
    const filePath = path.join(__dirname, `../sample-data/${filename}.hex`);

    return new ContractParamsProviderMock(dataFeeds, filePath, fs.readFileSync);
  };

  const performPayloadTest = async (
    callback: (
      adapter: IPricesContractAdapter,
      paramsProvider: ContractParamsProvider
    ) => Promise<BigNumberish[]>
  ): Promise<BigNumberish[]> => {
    const adapter = await deployPricesContract();
    const paramsProvider = createContractParamsProviderMock(["ETH", "BTC"]);

    return await callback(adapter, paramsProvider);
  };

  it("get_prices should return the price data", async () => {
    const values = await performPayloadTest(
      async (
        adapter: IPricesContractAdapter,
        paramsProvider: ContractParamsProvider
      ) => {
        return await adapter.getPricesFromPayload(paramsProvider);
      }
    );

    expect(values[0]).toBe(156962499984);
    expect(values[1]).toBe(2242266554738);
  });

  it("write_prices should write the price data that can be read then", async () => {
    const values = await performPayloadTest(
      async (
        adapter: IPricesContractAdapter,
        paramsProvider: ContractParamsProvider
      ) => {
        await adapter.writePricesFromPayloadToContract(paramsProvider);

        (paramsProvider as ContractParamsProviderMock).overriddenFeedIds = [
          "ETH",
          "AVAX",
          "BTC",
        ];

        const results = await Promise.all([
          adapter.readPricesFromContract(paramsProvider),
          adapter.readTimestampFromContract(),
        ]);
        const prices = results[0];
        const timestamp = results[1];

        expect(timestamp / 1000).toBe(SAMPLE_PACKAGES_TIMESTAMP);

        return prices;
      }
    );

    expect(values[0]).toBe(156962499984);
    expect(values[1]).toBe(0);
    expect(values[2]).toBe(2242266554738);
  });

  it("get_prices should panic with insufficient number of signers", async () => {
    const adapter = await deployPricesContract();
    const paramsProvider = createContractParamsProviderMock([
      "ETH",
      "BTC",
      "AVAX",
    ]);

    try {
      await adapter.getPricesFromPayload(paramsProvider);
    } catch (e) {
      expect(e).not.toBeNull();
    }
  });
});

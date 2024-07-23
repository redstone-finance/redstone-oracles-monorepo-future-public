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

  it("get_prices should return the price data", async () => {
    const values = await performPayloadTest(
      async (
        adapter: IPricesContractAdapter,
        paramsProvider: ContractParamsProvider
      ) => {
        return await adapter.getPricesFromPayload(paramsProvider);
      }
    );

    expect(values[0]).toBe(341899770128n);
    expect(values[1]).toBe(6371750000000n);
  });

  it("write_prices should write the price data that can be read then", async () => {
    const values = await performPayloadTest(
      async (
        adapter: IPricesContractAdapter,
        paramsProvider: ContractParamsProviderMock
      ) => {
        await adapter.writePricesFromPayloadToContract(paramsProvider);

        paramsProvider.overriddenFeedIds = ["ETH", "AVAX", "BTC"];

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

    expect(values[0]).toBe(341899770128n);
    expect(values[1]).toBe(0n);
    expect(values[2]).toBe(6371750000000n);
  });

  it("write_prices should overwrite prices", async () => {
    const values = await performPayloadTest(
      async (
        adapter: IPricesContractAdapter,
        paramsProvider: ContractParamsProviderMock
      ) => {
        await adapter.writePricesFromPayloadToContract(paramsProvider);

        const newParamsPovider =
          createContractParamsProviderMock("3sig_ETH_BTC_newer");
        newParamsPovider.overriddenFeedIds = ["BTC"];

        await adapter.writePricesFromPayloadToContract(newParamsPovider);
        return await adapter.readPricesFromContract(paramsProvider);
      }
    );

    expect(values[0]).toBe(0n);
    expect(values[1]).toBe(6379275977691n);
  });

  it("write_prices should not write the same price data twice", async () => {
    await expect(
      performPayloadTest(
        async (
          adapter: IPricesContractAdapter,
          paramsProvider: ContractParamsProviderMock
        ) => {
          await adapter.writePricesFromPayloadToContract(paramsProvider);

          return (await adapter.writePricesFromPayloadToContract(
            paramsProvider
          )) as BigNumberish[];
        }
      )
    ).rejects.toThrow();
  });

  it("get_prices should panic with insufficient number of signers", async () => {
    await expect(
      performPayloadTest(
        async (
          adapter: IPricesContractAdapter,
          paramsProvider: ContractParamsProviderMock
        ) => {
          return await adapter.getPricesFromPayload(paramsProvider);
        },
        ["ETH", "BTC", "AVAX"]
      )
    ).rejects.toThrow();
  });

  const createContractParamsProviderMock = (
    filename: string,
    dataFeeds: string[] = ["ETH", "BTC"]
  ) => {
    const filePath = path.join(__dirname, `../sample-data/${filename}.hex`);

    return new ContractParamsProviderMock(
      dataFeeds,
      filePath,
      fs.readFileSync,
      3
    );
  };

  const performPayloadTest = async (
    callback: (
      adapter: IPricesContractAdapter,
      paramsProvider: ContractParamsProviderMock
    ) => Promise<BigNumberish[]>,
    dataFeeds = ["ETH", "BTC"],
    filename = "3sig_ETH_BTC"
  ): Promise<BigNumberish[]> => {
    const adapter = await deployPricesContract();
    const paramsProvider = createContractParamsProviderMock(
      filename,
      dataFeeds
    );

    return await callback(adapter, paramsProvider);
  };
});

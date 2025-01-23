import { SuiClient } from "@mysten/sui/client";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import {
  DEFAULT_GAS_BUDGET,
  makeSuiClient,
  makeSuiKeypair,
  readSuiConfig,
  SuiNetworkSchema,
  SuiPricesContractAdapter,
} from "../src";

const DATA_SERVICE_ID = "redstone-primary-prod";
const WRITE_TEST_TIMEOUT = 20 * 1_000; // 20 secs

describe("SuiPricesContractAdapter", () => {
  let adapter: SuiPricesContractAdapter;
  let contractParamsProvider: ContractParamsProvider;
  let suiClient: SuiClient;

  beforeAll(() => {
    const network = RedstoneCommon.getFromEnv("NETWORK", SuiNetworkSchema);
    const config = readSuiConfig(network);
    config.writePricesTxGasBudget = DEFAULT_GAS_BUDGET;
    const client = makeSuiClient(network);
    const keypair = makeSuiKeypair();
    adapter = new SuiPricesContractAdapter(client, config, keypair);
    suiClient = makeSuiClient(network);
  });

  beforeEach(() => {
    contractParamsProvider = new ContractParamsProvider({
      dataServiceId: DATA_SERVICE_ID,
      dataPackagesIds: ["LBTC"],
      uniqueSignersCount: 3,
    });
  });

  describe("getUniqueSignerThreshold", () => {
    it("should return the unique signer threshold", async () => {
      const result = await adapter.getUniqueSignerThreshold();
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(8);
    });
  });

  describe.skip("getPricesFromPayload", () => {});

  describe.skip("readTimestampFromContract", () => {});

  describe("writePricesFromPayloadToContract", () => {
    it(
      "should write prices from payload to contract",
      async () => {
        const result = await adapter.writePricesFromPayloadToContract(
          contractParamsProvider
        );
        await checkResult(result);
      },
      WRITE_TEST_TIMEOUT
    );

    it(
      "should write prices with multiple feed IDs",
      async () => {
        contractParamsProvider = new ContractParamsProvider({
          dataServiceId: DATA_SERVICE_ID,
          dataPackagesIds: ["ETH", "BTC"],
          uniqueSignersCount: 3,
        });

        const result = await adapter.writePricesFromPayloadToContract(
          contractParamsProvider
        );
        await checkResult(result);
      },
      WRITE_TEST_TIMEOUT
    );
  });

  describe("readLatestUpdateBlockTimestamp", () => {
    it("should read the latest update block timestamp", async () => {
      const result = await adapter.readLatestUpdateBlockTimestamp("ETH");
      expect(result).toBeGreaterThanOrEqual(0);
      const fullYear = new Date(result).getFullYear();
      expect(fullYear).toBeGreaterThan(2024);
    });
  });

  describe("readPricesFromContract", () => {
    it("should read prices from contract", async () => {
      const result = await adapter.readPricesFromContract(
        contractParamsProvider
      );
      expect(result.length).toBeGreaterThan(0);
      expect(typeof result[0] === "bigint");
    });

    it("should read prices with multiple feed IDs", async () => {
      contractParamsProvider = new ContractParamsProvider({
        dataServiceId: DATA_SERVICE_ID,
        dataPackagesIds: ["LBTC", "ETH", "BTC"],
        uniqueSignersCount: 3,
      });

      const result = await adapter.readPricesFromContract(
        contractParamsProvider
      );

      expect(result.length).toBe(3);
      result.forEach((price) => {
        expect(typeof price === "bigint");
      });

      // this would fail if ETH flipped BTC
      expect(result[1] < result[2]).toBeTruthy();
    });
  });

  async function checkResult(result: string) {
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThanOrEqual(0);
    const receipt = await suiClient.waitForTransaction({ digest: result });
    expect(receipt.digest).toBe(result);
    const response = await suiClient.getTransactionBlock({
      digest: result,
      options: {
        showEffects: true,
      },
    });
    const status = response.effects!.status.status;
    expect(status).toEqual("success");
  }
});

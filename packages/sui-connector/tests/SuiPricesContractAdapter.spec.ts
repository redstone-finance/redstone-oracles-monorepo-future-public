import { SuiClient } from "@mysten/sui/client";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { RedstoneCommon } from "@redstone-finance/utils";
import { expect } from "chai";
import dotenv from "dotenv";
import { makeSuiClient, makeSuiKeypair } from "../src";
import { SuiPricesContractAdapter } from "../src/SuiPricesContractAdapter";
import { NetworkEnum } from "../src/config";
import { readSuiConfig } from "../src/util";

const DATA_SERVICE_ID = "redstone-primary-prod";
const WRITE_TEST_TIMEOUT = 20 * 1_000; // 20 secs

describe("SuiPricesContractAdapter", () => {
  let adapter: SuiPricesContractAdapter;
  let contractParamsProvider: ContractParamsProvider;
  let suiClient: SuiClient;

  beforeAll(async () => {
    dotenv.config();
    const network = RedstoneCommon.getFromEnv("NETWORK", NetworkEnum);
    const config = readSuiConfig(network);
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
      expect(result).to.be.gt(0);
      expect(result).to.be.lt(8);
    });
  });

  describe.skip("getPricesFromPayload", () => {});

  describe.skip("readTimestampFromContract", () => {});

  describe("writePricesFromPayloadToContract", () => {
    it("should write prices from payload to contract", async () => {
      const result = await adapter.writePricesFromPayloadToContract(
        contractParamsProvider
      );
      expect(typeof result).to.eq("string");
      expect(result.length).to.be.gte(0);
      const receipt = await suiClient.waitForTransaction({ digest: result! });
      expect(receipt.digest).to.eq(result!);
    }, WRITE_TEST_TIMEOUT);

    it("should write prices with multiple feed IDs", async () => {
      contractParamsProvider = new ContractParamsProvider({
        dataServiceId: DATA_SERVICE_ID,
        dataPackagesIds: ["ETH", "BTC"],
        uniqueSignersCount: 3,
      });

      const result = await adapter.writePricesFromPayloadToContract(
        contractParamsProvider
      );
      expect(typeof result).to.eq("string");
      expect(result.length).to.be.gte(0);
      const receipt = await suiClient.waitForTransaction({ digest: result! });
      expect(receipt.digest).to.eq(result!);
    }, WRITE_TEST_TIMEOUT);

    it("should write prices for a lot of feeds", async () => {
      contractParamsProvider = new ContractParamsProvider({
        dataServiceId: DATA_SERVICE_ID,
        dataPackagesIds: [
          "USDT",
          "LINK",
          "AVAX",
          "USDC",
          "EUROC",
          "DAI",
          "EUR",
          "CRV",
          "BNB",
          "wstETH",
          "ezETH",
          "pzETH",
          "ETH+",
          "XVS",
          "SolvBTC",
          "STONE",
          "WBTC",
          "bsdETH",
          "AERO",
          "eUSD",
        ],
        uniqueSignersCount: 3,
      });

      const result = await adapter.writePricesFromPayloadToContract(
        contractParamsProvider
      );

      expect(typeof result).to.eq("string");
      expect(result.length).to.be.gte(0);
      const receipt = await suiClient.waitForTransaction({ digest: result! });
      expect(receipt.digest).to.eq(result!);
    }, WRITE_TEST_TIMEOUT);
  });

  describe("readLatestUpdateBlockTimestamp", () => {
    it("should read the latest update block timestamp", async () => {
      const result = await adapter.readLatestUpdateBlockTimestamp();
      expect(result).to.be.gt(0);
      const fullYear = new Date(result).getFullYear();
      expect(fullYear).to.be.gt(2020);
    });
  });

  describe("readPricesFromContract", () => {
    it("should read prices from contract", async () => {
      const result = await adapter.readPricesFromContract(
        contractParamsProvider
      );
      expect(result.length).to.be.gt(0);
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

      expect(result.length).to.be.gt(0);
      expect(result.length).to.be.eq(3);
      result.forEach((price) => {
        expect(typeof price === "bigint");
      });

      // this would fail if ETH flipped BTC
      expect(result[1] < result[2]).to.be.true;
    });
  });
});

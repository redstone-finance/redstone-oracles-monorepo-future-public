import { RedstoneCommon } from "@redstone-finance/utils";
import "dotenv/config";
import {
  makeSuiClient,
  makeSuiKeypair,
  readSuiConfig,
  SuiNetworkSchema,
  SuiPricesContractAdapter,
  SuiPricesContractConnector,
} from "../src";

describe("SuiContractConnector", () => {
  let connector: SuiPricesContractConnector;

  beforeAll(() => {
    const network = RedstoneCommon.getFromEnv("NETWORK", SuiNetworkSchema);

    connector = new SuiPricesContractConnector(
      makeSuiClient(network),
      readSuiConfig(network),
      makeSuiKeypair()
    );
  });

  describe("getBlockNumber", () => {
    it("should get block number", async () => {
      const result = await connector.getBlockNumber();
      expect(result).toBeGreaterThan(10);
    });
  });

  describe("getAdapter", () => {
    it("should return adapter", async () => {
      const adapter = await connector.getAdapter();
      expect(adapter).toBeInstanceOf(SuiPricesContractAdapter);
    });
  });
});

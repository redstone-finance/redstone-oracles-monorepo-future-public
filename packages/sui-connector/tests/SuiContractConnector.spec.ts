import { expect } from "chai";
import dotenv from "dotenv";

import { RedstoneCommon } from "@redstone-finance/utils";
import {
  makeSuiClient,
  makeSuiKeypair,
  readSuiConfig,
  SuiContractConnector,
  SuiPricesContractAdapter,
} from "../src";
import { NetworkEnum } from "../src/config";

describe("SuiContractConnector", () => {
  let connector: SuiContractConnector;

  beforeAll(() => {
    dotenv.config();
    const network = RedstoneCommon.getFromEnv("NETWORK", NetworkEnum);

    connector = new SuiContractConnector(
      makeSuiClient(network),
      readSuiConfig(network),
      makeSuiKeypair()
    );
  });

  describe("getBlockNumber", () => {
    it("should get block number", async () => {
      const result = await connector.getBlockNumber();
      expect(result).to.be.gte(10);
    });
  });

  describe("getAdapter", () => {
    it("should return adapter", async () => {
      const adapter = await connector.getAdapter();
      expect(adapter).to.be.instanceOf(SuiPricesContractAdapter);
    });
  });
});

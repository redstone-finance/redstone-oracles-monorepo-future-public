import { expect } from "chai";
import { ValuesForDataFeeds } from "redstone-sdk";
import { config } from "../../src/config";
import { shouldUpdate } from "../../src/core/update-conditions/should-update";
import {
  createNumberFromContract,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";

describe("should-update", () => {
  before(() => {
    mockEnvVariables();
  });

  it("should return false if all checks fail", async () => {
    const dataPackages = await getDataPackagesResponse();
    const smallerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1630.99),
      BTC: createNumberFromContract(23011.68),
    };
    const lastUpdateTimestamp = Date.now() - 1;
    const { shouldUpdatePrices, warningMessage } = await shouldUpdate(
      {
        dataPackages,
        valuesFromContract: smallerValueDiff,
        lastUpdateTimestamp,
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(JSON.parse(warningMessage)[0]).to.match(
      /Not enough time has passed to update prices/
    );

    expect(JSON.parse(warningMessage)[1]).to.match(
      /Value has not deviated enough to/
    );
  });

  it("should return true if value-deviation check succeed", async () => {
    const dataPackages = await getDataPackagesResponse();
    const biggerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1230.99),
      BTC: createNumberFromContract(13011.68),
    };
    const lastUpdateTimestamp = Date.now() - 1;
    const { shouldUpdatePrices, warningMessage } = await shouldUpdate(
      {
        dataPackages,
        valuesFromContract: biggerValueDiff,
        lastUpdateTimestamp,
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(JSON.parse(warningMessage)).to.match(
      /Not enough time has passed to update prices/
    );
  });

  it("should return true if time check succeed", async () => {
    const dataPackages = await getDataPackagesResponse();
    const smallerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1630.99),
      BTC: createNumberFromContract(23011.68),
    };
    const lastUpdateTimestamp = Date.now() - 100000;
    const { shouldUpdatePrices, warningMessage } = await shouldUpdate(
      {
        dataPackages,
        valuesFromContract: smallerValueDiff,
        lastUpdateTimestamp,
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(JSON.parse(warningMessage)).to.match(
      /Value has not deviated enough to be updated/
    );
  });

  it("should return true for same value when data packages contains custom decimals", async () => {
    const dataPackages = await getDataPackagesResponse([
      { value: 124567, dataFeedId: "timestamp", decimals: 0 },
      { value: 1247, dataFeedId: "timestamp2", decimals: 2 },
    ]);

    const sameValue: ValuesForDataFeeds = {
      timestamp: createNumberFromContract(124567, 0),
      timestamp2: createNumberFromContract(1247, 2),
    };

    const lastUpdateTimestamp = Date.now() - 100000;
    const { warningMessage } = await shouldUpdate(
      {
        dataPackages,
        valuesFromContract: sameValue,
        lastUpdateTimestamp,
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(warningMessage).to.match(
      /Value has not deviated enough to be updated/
    );
  });

  it("should return true for smaller value when data packages contains custom decimals", async () => {
    const dataPackages = await getDataPackagesResponse([
      { value: 124567, dataFeedId: "timestamp", decimals: 0 },
    ]);

    const sameValue: ValuesForDataFeeds = {
      timestamp: createNumberFromContract(Math.floor(124567 * 0.8), 0),
    };

    const lastUpdateTimestamp = Date.now() - 100000;
    const { warningMessage } = await shouldUpdate(
      {
        dataPackages,
        valuesFromContract: sameValue,
        lastUpdateTimestamp,
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(warningMessage).to.match(/Enough time passed to updated price/);
  });
});

import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { expect } from "chai";
import { config } from "../../src/config";
import { shouldUpdate } from "../../src/price-feeds/should-update";
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
        dataFromContract: {
          ETH: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: lastUpdateTimestamp,
            lastValue: smallerValueDiff.ETH!,
          },
          BTC: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: lastUpdateTimestamp,
            lastValue: smallerValueDiff.BTC!,
          },
        },
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage.split("; ")[0]).to.match(
      /Not enough time has passed to update prices/
    );

    expect(warningMessage.split("; ")[1]).to.match(
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
        dataFromContract: {
          ETH: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: Date.now() - 1000000,
            lastValue: biggerValueDiff.ETH!,
          },
          BTC: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: Date.now() - 1000000,
            lastValue: biggerValueDiff.BTC!,
          },
        },
        uniqueSignersThreshold: 2,
      },
      config()
    );
    console.log(warningMessage);
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
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
        dataFromContract: {
          ETH: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: lastUpdateTimestamp,
            lastValue: smallerValueDiff.ETH!,
          },
          BTC: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: lastUpdateTimestamp,
            lastValue: smallerValueDiff.BTC!,
          },
        },
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
      /Value has not deviated enough to be updated/
    );
  });

  it("should return true for same value when data packages contains custom decimals", async () => {
    const dataPackages = await getDataPackagesResponse([
      { value: 124567, dataFeedId: "ETH", decimals: 0 },
      { value: 1247, dataFeedId: "BTC", decimals: 2 },
    ]);

    const sameValue: ValuesForDataFeeds = {
      ETH: createNumberFromContract(124567, 0),
      BTC: createNumberFromContract(1247, 2),
    };

    const lastUpdateTimestamp = Date.now() - 100000;
    const { warningMessage } = await shouldUpdate(
      {
        dataPackages,
        dataFromContract: {
          ETH: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: lastUpdateTimestamp,
            lastValue: sameValue.ETH!,
          },
          BTC: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: lastUpdateTimestamp,
            lastValue: sameValue.BTC!,
          },
        },
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(warningMessage).to.match(
      /Value has not deviated enough to be updated/
    );
  });

  it("should return true for smaller value when data packages contains custom decimals", async () => {
    mockEnvVariables({
      dataFeeds: ["ETH"],
    });
    const dataPackages = await getDataPackagesResponse([
      { value: 124567, dataFeedId: "ETH", decimals: 0 },
    ]);

    const sameValue: ValuesForDataFeeds = {
      ETH: createNumberFromContract(Math.floor(124567 * 0.8), 0),
    };

    const lastUpdateTimestamp = Date.now() - 100000;
    const { warningMessage } = await shouldUpdate(
      {
        dataPackages,
        dataFromContract: {
          ETH: {
            lastBlockTimestampMS: lastUpdateTimestamp,
            lastDataPackageTimestampMS: Date.now() + 100000,
            lastValue: sameValue.ETH!,
          },
        },
        uniqueSignersThreshold: 2,
      },
      config()
    );
    expect(warningMessage).to.match(/Enough time passed to updated price/);
  });
});

import { expect } from "chai";
import { config } from "../../src/config";
import {
  createNumberFromContract,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";
import { ValuesForDataFeeds } from "redstone-sdk";
import { fallbackDeviationCondition } from "../../src/core/update-conditions/fallback-deviation-condition";

const HISTORICAL_DATA_POINTS = [
  { dataFeedId: "ETH", value: 1660.99 },
  { dataFeedId: "BTC", value: 23088.68 },
];

const VERY_SMALL_DATA_POINTS = [
  { dataFeedId: "ETH", value: 660.99 },
  { dataFeedId: "BTC", value: 3066.68 },
];

describe("fallback-deviation-condition", () => {
  before(() => {
    mockEnvVariables();
  });

  it("should return false if older value diff bigger than expected but latest not", async () => {
    const dataPackages = await getDataPackagesResponse();
    const olderDataPackages = await getDataPackagesResponse(
      VERY_SMALL_DATA_POINTS
    );
    const smallerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1630.99),
      BTC: createNumberFromContract(23011.68),
    };
    const { shouldUpdatePrices, warningMessage } = fallbackDeviationCondition(
      dataPackages,
      olderDataPackages,
      smallerValueDiff,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Fallback deviation: Value has not deviated enough to be updated/
    );
    expect(warningMessage).to.match(
      /Older Value has deviated enough to be updated/
    );
  });

  it("should return false if latest value diff bigger than expected but older not", async () => {
    const dataPackages = await getDataPackagesResponse();
    const olderDataPackages = await getDataPackagesResponse(
      VERY_SMALL_DATA_POINTS
    );
    const biggerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(630.99),
      BTC: createNumberFromContract(3011.68),
    };
    const { shouldUpdatePrices, warningMessage } = fallbackDeviationCondition(
      dataPackages,
      olderDataPackages,
      biggerValueDiff,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Fallback deviation: Value has deviated enough to be/
    );
    expect(warningMessage).to.match(
      /Older Value has not deviated enough to be/
    );
  });

  it("should return true if both latest and older values diff bigger than expected", async () => {
    const dataPackages = await getDataPackagesResponse();
    const olderDataPackages = await getDataPackagesResponse(
      HISTORICAL_DATA_POINTS
    );
    const biggerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1230.99),
      BTC: createNumberFromContract(13011.68),
    };
    const { shouldUpdatePrices, warningMessage } = fallbackDeviationCondition(
      dataPackages,
      olderDataPackages,
      biggerValueDiff,
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
      /Fallback deviation: Value has deviated enough to be/
    );
    expect(warningMessage).to.match(/Older Value has deviated enough to be/);
  });

  it("should return false if both latest and older values diff lower than expected", async () => {
    const dataPackages = await getDataPackagesResponse();
    const olderDataPackages = await getDataPackagesResponse(
      HISTORICAL_DATA_POINTS
    );
    const biggerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1630.99),
      BTC: createNumberFromContract(23011.68),
    };
    const { shouldUpdatePrices, warningMessage } = fallbackDeviationCondition(
      dataPackages,
      olderDataPackages,
      biggerValueDiff,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Fallback deviation: Value has not deviated enough to be/
    );
    expect(warningMessage).to.match(
      /Older Value has not deviated enough to be/
    );
  });
});

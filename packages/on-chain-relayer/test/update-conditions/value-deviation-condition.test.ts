import { expect } from "chai";
import { ValuesForDataFeeds } from "redstone-sdk";
import { valueDeviationCondition } from "../../src/core/update-conditions/value-deviation-condition";
import {
  createNumberFromContract,
  getDataPackagesResponse,
  mockEnvVariables,
} from "../helpers";

describe("value-deviation-condition", () => {
  before(() => {
    mockEnvVariables();
  });

  it("should return false if value diff smaller than expected", async () => {
    const dataPackages = await getDataPackagesResponse();
    const smallerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1630.99),
      BTC: createNumberFromContract(23011.68),
    };
    const { shouldUpdatePrices, warningMessage } = valueDeviationCondition(
      dataPackages,
      smallerValueDiff
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Value has not deviated enough to be updated/
    );
  });

  it("should return true if value diff bigger than expected", async () => {
    const dataPackages = await getDataPackagesResponse();
    const biggerValueDiff: ValuesForDataFeeds = {
      ETH: createNumberFromContract(1230.99),
      BTC: createNumberFromContract(13011.68),
    };
    const { shouldUpdatePrices, warningMessage } = valueDeviationCondition(
      dataPackages,
      biggerValueDiff
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(/Value has deviated enough to be/);
  });
});

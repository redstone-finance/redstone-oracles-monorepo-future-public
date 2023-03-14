import { expect } from "chai";
import { valueDeviationCondition } from "../../src/core/update-conditions/value-deviation-condition";
import { getDataPackagesResponse, mockEnvVariables } from "../helpers";
import { ValuesForDataFeeds } from "../../src/types";

describe("value-deviation-condition", () => {
  before(() => {
    mockEnvVariables();
  });

  it("should return false if value diff smaller than expected", () => {
    const dataPackages = getDataPackagesResponse();
    const smallerValueDiff: ValuesForDataFeeds = {
      ETH: 1630.99,
      BTC: 23011.68,
    };
    const { shouldUpdatePrices, warningMessage } = valueDeviationCondition(
      dataPackages,
      smallerValueDiff
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.be.equal(
      "Value has not deviated enough to be updated"
    );
  });

  it("should return true if value diff bigger than expected", () => {
    const dataPackages = getDataPackagesResponse();
    const biggerValueDiff: ValuesForDataFeeds = { ETH: 1230.99, BTC: 13011.68 };
    const { shouldUpdatePrices, warningMessage } = valueDeviationCondition(
      dataPackages,
      biggerValueDiff
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.be.equal("");
  });
});

import { expect } from "chai";
import { shouldUpdate } from "../../src/core/update-conditions/should-update";
import { getDataPackagesResponse, mockEnvVariables } from "../helpers";
import { ValuesForDataFeeds } from "../../src/types";

describe("should-update", () => {
  before(() => {
    mockEnvVariables();
  });

  it("should return false if all checks fail", () => {
    const dataPackages = getDataPackagesResponse();
    const smallerValueDiff: ValuesForDataFeeds = {
      ETH: 1630.99,
      BTC: 23011.68,
    };
    const lastUpdateTimestamp = Date.now() - 1;
    const { shouldUpdatePrices, warningMessage } = shouldUpdate({
      dataPackages,
      valuesFromContract: smallerValueDiff,
      lastUpdateTimestamp,
    });
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.be.equal(
      JSON.stringify([
        "Not enough time has passed to update prices",
        "Value has not deviated enough to be updated",
      ])
    );
  });

  it("should return true if value-deviation check succeed", () => {
    const dataPackages = getDataPackagesResponse();
    const biggerValueDiff: ValuesForDataFeeds = { ETH: 1230.99, BTC: 13011.68 };
    const lastUpdateTimestamp = Date.now() - 1;
    const { shouldUpdatePrices, warningMessage } = shouldUpdate({
      dataPackages,
      valuesFromContract: biggerValueDiff,
      lastUpdateTimestamp,
    });
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.be.equal(
      `["Not enough time has passed to update prices"]`
    );
  });

  it("should return true if time check succeed", () => {
    const dataPackages = getDataPackagesResponse();
    const smallerValueDiff: ValuesForDataFeeds = {
      ETH: 1630.99,
      BTC: 23011.68,
    };
    const lastUpdateTimestamp = Date.now() - 100000;
    const { shouldUpdatePrices, warningMessage } = shouldUpdate({
      dataPackages,
      valuesFromContract: smallerValueDiff,
      lastUpdateTimestamp,
    });
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.be.equal(
      `["Value has not deviated enough to be updated"]`
    );
  });
});

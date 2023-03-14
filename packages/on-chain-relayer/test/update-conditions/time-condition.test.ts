import { expect } from "chai";
import { timeUpdateCondition } from "../../src/core/update-conditions/time-condition";
import { mockEnvVariables } from "../helpers";

describe("time-condition", () => {
  before(() => {
    mockEnvVariables();
  });

  it("should return false if time diff smaller than interval", () => {
    const lastUpdateTimestamp = Date.now() - 1;
    const { shouldUpdatePrices, warningMessage } =
      timeUpdateCondition(lastUpdateTimestamp);
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.be.equal(
      "Not enough time has passed to update prices"
    );
  });

  it("should return true if time diff bigger than interval", () => {
    const lastUpdateTimestamp = Date.now() - 100000;
    const { shouldUpdatePrices, warningMessage } =
      timeUpdateCondition(lastUpdateTimestamp);
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.be.equal("");
  });
});

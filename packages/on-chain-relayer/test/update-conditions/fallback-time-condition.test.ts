import { expect } from "chai";
import { config } from "../../src/config";
import { mockEnvVariables } from "../helpers";
import { timeUpdateCondition } from "../../src/core/update-conditions/time-condition";

describe("fallback-time-condition", () => {
  before(() => {
    mockEnvVariables({ fallbackOffsetInMinutes: 1 });
  });

  it("should return false if time diff smaller than interval", () => {
    const lastUpdateTimestamp = Date.now() - 1;
    const { shouldUpdatePrices, warningMessage } = timeUpdateCondition(
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Fallback time: Not enough time has passed to update prices/
    );
  });

  it("should return false if time diff bigger than interval but less than interval increased by offset", () => {
    const lastUpdateTimestamp = Date.now() - 60999;
    const { shouldUpdatePrices, warningMessage } = timeUpdateCondition(
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Fallback time: Not enough time has passed to update prices/
    );
  });

  it("should return true if time diff bigger than interval increased by offset", () => {
    const lastUpdateTimestamp = Date.now() - 61000;
    const { shouldUpdatePrices, warningMessage } = timeUpdateCondition(
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
      /Fallback time: Enough time passed to updated prices/
    );
  });
});

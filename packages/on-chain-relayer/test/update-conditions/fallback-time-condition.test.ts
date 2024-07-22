import { expect } from "chai";
import { config } from "../../src/config";
import { timeUpdateCondition } from "../../src/core/update-conditions/time-condition";
import { mockEnvVariables } from "../helpers";

describe("fallback-time-condition", () => {
  before(() => {
    mockEnvVariables({
      fallbackOffsetInMinutes: 1,
    });
  });

  it("should return false if time diff smaller than interval", () => {
    const lastUpdateTimestamp = Date.now() - 1;
    const { shouldUpdatePrices, warningMessage } = timeUpdateCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Time in fallback mode: Not enough time has passed to update prices/
    );
  });

  it("should return false if time diff bigger than interval but less than interval increased by offset", () => {
    const lastUpdateTimestamp = Date.now() - 60999;
    const { shouldUpdatePrices, warningMessage } = timeUpdateCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Time in fallback mode: Not enough time has passed to update prices/
    );
  });

  it("should return true if time diff bigger than interval increased by offset", () => {
    const lastUpdateTimestamp = Date.now() - 61000;
    const { shouldUpdatePrices, warningMessage } = timeUpdateCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
      /Time in fallback mode: Enough time passed to updated prices/
    );
  });
});

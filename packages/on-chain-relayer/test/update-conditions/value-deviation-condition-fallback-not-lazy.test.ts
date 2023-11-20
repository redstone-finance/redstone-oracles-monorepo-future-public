import { expect } from "chai";
import { mockEnvVariables } from "../helpers";
import {
  HISTORICAL_DATA_POINTS,
  performFallbackValueDeviationConditionTest,
  VERY_SMALL_DATA_POINTS,
} from "./perform-fallback-value-deviation-condition-test";

describe("value-deviation-condition fallback mode not lazy tests", () => {
  before(() => {
    mockEnvVariables({
      fallbackOffsetInMinutes: 1,
      historicalPackagesGateways: ["X"],
      isNotLazy: true,
    });
  });

  it("should return false if older value diff bigger than expected but latest not", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performFallbackValueDeviationConditionTest(
        1630.99,
        23011.68,
        VERY_SMALL_DATA_POINTS
      );

    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Deviation in fallback mode: Value has not deviated enough to be updated/
    );
    expect(warningMessage).to.match(
      /Historical Value has deviated enough to be updated/
    );
  });

  it("should return false if latest value diff bigger than expected but older not", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performFallbackValueDeviationConditionTest(
        630.99,
        3011.68,
        VERY_SMALL_DATA_POINTS
      );

    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Deviation in fallback mode: Value has deviated enough to be/
    );
    expect(warningMessage).to.match(
      /Historical Value has not deviated enough to be/
    );
  });

  it("should return true if both latest and older values diff bigger than expected", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performFallbackValueDeviationConditionTest(
        1230.99,
        13011.68,
        HISTORICAL_DATA_POINTS
      );

    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
      /Deviation in fallback mode: Value has deviated enough to be/
    );
    expect(warningMessage).to.match(
      /Historical Value has deviated enough to be/
    );
  });

  it("should return false if both latest and older values diff lower than expected", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performFallbackValueDeviationConditionTest(
        1630.99,
        23011.68,
        HISTORICAL_DATA_POINTS
      );

    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Deviation in fallback mode: Value has not deviated enough to be/
    );
    expect(warningMessage).to.match(
      /Historical Value has not deviated enough to be/
    );
  });
});

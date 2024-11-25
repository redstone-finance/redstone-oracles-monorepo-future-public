import { expect } from "chai";
import { RelayerConfig } from "../../src";
import { mockConfig } from "../helpers";
import {
  HISTORICAL_DATA_POINTS,
  performFallbackValueDeviationConditionTest,
  performSkipFrequentUpdatesCheck,
  VERY_SMALL_DATA_POINTS,
} from "./perform-fallback-value-deviation-condition-test";

describe("value-deviation-condition fallback mode tests", () => {
  let relayerConfig: RelayerConfig;

  before(() => {
    relayerConfig = mockConfig({
      fallbackOffsetInMilliseconds: 60_000,
      historicalPackagesGateways: ["X"],
    });
  });

  it("should return false if older value diff bigger than expected but latest not", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performFallbackValueDeviationConditionTest(
        relayerConfig,
        1630.99,
        23011.68,
        VERY_SMALL_DATA_POINTS
      );

    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Deviation in fallback mode: Value has not deviated enough to be updated/
    );
    expect(warningMessage).not.to.match(
      /Historical Value has deviated enough to be updated/
    );
  });

  it("should return false if latest value diff bigger than expected but older not", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performFallbackValueDeviationConditionTest(
        relayerConfig,
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
        relayerConfig,
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
        relayerConfig,
        1630.99,
        23011.68,
        HISTORICAL_DATA_POINTS
      );

    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Deviation in fallback mode: Value has not deviated enough to be/
    );
    expect(warningMessage).not.to.match(
      /Historical Value has not deviated enough to be/
    );
  });

  it("should return false if not enough time passed since last update but the updated package is not newer than the historical one", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performSkipFrequentUpdatesCheck(true, false);

    expect(shouldUpdatePrices).to.be.false;

    expect(warningMessage).to.match(
      /Deviation in fallback mode:.*Update skipped: less than.*milliseconds passed since last update.*Value has deviated enough to be.*Historical Value has deviated enough to be/
    );
    expect(warningMessage).not.to.match(/last updated package timestamp/);
  });

  it("should return false if not enough time passed since last update and the updated package is newer than the historical one", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performSkipFrequentUpdatesCheck(true, true);

    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Deviation in fallback mode:.*Update skipped: less than.*milliseconds passed since last update.*; last updated package timestamp.*is newer that the historical one.*Value has deviated enough to be.*Historical Value has deviated enough to be/
    );
  });

  it("should return false if enough time passed since last update but the updated package is newer than the historical one", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performSkipFrequentUpdatesCheck(false, true);

    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Deviation in fallback mode:.*Update skipped: last updated package timestamp.*is newer that the historical one.*Value has deviated enough to be.*Historical Value has deviated enough to be/
    );
    expect(warningMessage).not.to.match(
      /milliseconds passed since last update/
    );
  });

  it("should return true if skip frequent updates enabled and enough time passed since last update and the updated package is not newer than the historical one", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await performSkipFrequentUpdatesCheck(false, false);

    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
      /Deviation in fallback mode: Value has deviated enough to be/
    );
    expect(warningMessage).to.match(
      /Historical Value has deviated enough to be/
    );
    expect(warningMessage).not.to.match(/Update skipped:/);
    expect(warningMessage).not.to.match(
      /milliseconds passed since last update/
    );
    expect(warningMessage).not.to.match(/last updated package timestamp/);
  });
});

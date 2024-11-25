import { expect } from "chai";
import { RelayerConfig } from "../../src";
import { cronCondition } from "../../src/core/update-conditions/cron-condition";
import {
  dateStrToMilliseconds,
  mockConfig,
  restoreOriginalSystemTime,
  setCurrentSystemTime,
} from "../helpers";

describe("fallback-cron-condition", () => {
  let relayerConfig: RelayerConfig;

  before(() => {
    relayerConfig = mockConfig({
      updateTriggers: {
        ETH: {
          cron: ["0 * * * *"], // every hour at 0th minute
        },
      },
      fallbackOffsetInMilliseconds: 60_000,
    });
  });

  after(() => {
    restoreOriginalSystemTime();
  });

  it("should properly return false as it would return even without fallback", () => {
    setCurrentSystemTime("2023-08-16T00:01:00");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T00:00:30");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      relayerConfig
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(messages[0].message).to.match(
      /Should not update prices according to cron expr/
    );
  });

  it("should properly return false due to offset", () => {
    setCurrentSystemTime("2023-08-16T00:01:00");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-15T23:00:01");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      relayerConfig
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(messages[0].message).to.match(
      /Should not update prices according to cron expr/
    );
  });

  it("should return true if time diff bigger than interval increased by offset", () => {
    setCurrentSystemTime("2023-08-16T00:02:01");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-15T23:59:59");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      relayerConfig
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(messages[0].message).to.match(
      /Should update prices according to cron expr/
    );
  });
});

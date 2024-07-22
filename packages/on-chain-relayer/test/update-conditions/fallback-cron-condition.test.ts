import { expect } from "chai";
import { config } from "../../src/config";
import { cronCondition } from "../../src/core/update-conditions/cron-condition";
import {
  dateStrToMilliseconds,
  mockEnvVariables,
  restoreOriginalSystemTime,
  setCurrentSystemTime,
} from "../helpers";

describe("fallback-cron-condition", () => {
  before(() => {
    mockEnvVariables({
      updateTriggers: {
        ETH: {
          cron: ["0 * * * *"], // every hour at 0th minute
        },
      },
      fallbackOffsetInMinutes: 1,
    });
  });

  after(() => {
    restoreOriginalSystemTime();
  });

  it("should properly return false as it would return even without fallback", () => {
    setCurrentSystemTime("2023-08-16T00:01:00");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T00:00:30");
    const { shouldUpdatePrices, warningMessage } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Should not update prices according to cron expr/
    );
  });

  it("should properly return false due to offset", () => {
    setCurrentSystemTime("2023-08-16T00:01:00");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-15T23:00:01");
    const { shouldUpdatePrices, warningMessage } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Should not update prices according to cron expr/
    );
  });

  it("should return true if time diff bigger than interval increased by offset", () => {
    setCurrentSystemTime("2023-08-16T00:02:01");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-15T23:59:59");
    const { shouldUpdatePrices, warningMessage } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
      /Should update prices according to cron expr/
    );
  });
});

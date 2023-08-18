import { expect } from "chai";
import { config } from "../../src/config";
import { cronCondition } from "../../src/core/update-conditions/cron-condition";
import {
  dateStrToMilliseconds,
  mockEnvVariables,
  originalDateNow,
  restoreOriginalSystemTime,
  setCurrentSystemTime,
} from "../helpers";

describe("cron-condition", () => {
  before(() => {
    mockEnvVariables({
      cronExpression: "0 * * * *", // every hour at 0th minute
    });
  });

  after(() => {
    restoreOriginalSystemTime();
  });

  it("should properly return false if was recently updated", () => {
    setCurrentSystemTime("2023-08-16T00:01:00");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T00:00:30");
    const { shouldUpdatePrices, warningMessage } = cronCondition(
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Should not update prices according to cron expr/
    );
  });

  it("should properly return false if was updated some time ago", () => {
    setCurrentSystemTime("2023-08-16T00:59:59");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T00:00:30");
    const { shouldUpdatePrices, warningMessage } = cronCondition(
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.match(
      /Should not update prices according to cron expr/
    );
  });

  it("should properly return true", () => {
    setCurrentSystemTime("2023-08-16T01:00:01");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T00:59:59");
    const { shouldUpdatePrices, warningMessage } = cronCondition(
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.match(
      /Should update prices according to cron expr/
    );
  });
});

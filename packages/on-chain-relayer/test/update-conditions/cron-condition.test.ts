import { expect } from "chai";
import { config } from "../../src/config";
import { cronCondition } from "../../src/core/update-conditions/cron-condition";
import {
  dateStrToMilliseconds,
  mockEnvVariables,
  restoreOriginalSystemTime,
  setCurrentSystemTime,
} from "../helpers";

const SHOULD_NOT_UPDATE_REGEXP =
  /Should not update prices according to cron expr/;
const SHOULD_UPDATE_REGEXP = /Should update prices according to cron expr/;
describe("cron-condition", () => {
  before(() => {
    mockEnvVariables({
      updateTriggers: {
        ETH: {
          cron: ["0 * * * *"], // every hour at 0th minute
        },
      },
    });
  });

  after(() => {
    restoreOriginalSystemTime();
  });

  it("should properly return false if was recently updated", () => {
    setCurrentSystemTime("2023-08-16T00:01:00");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T00:00:30");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(messages[0].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
  });

  it("should properly return false if was updated some time ago", () => {
    setCurrentSystemTime("2023-08-16T00:59:59");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T00:00:30");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(messages[0].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
  });

  it("should properly return true", () => {
    setCurrentSystemTime("2023-08-16T01:00:01");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T00:59:59");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(messages[0].message).to.match(SHOULD_UPDATE_REGEXP);
  });

  it("should return true if one of multiple cron expressions fulfilled", () => {
    mockEnvVariables({
      updateTriggers: {
        ETH: {
          cron: ["0 * * * *", "1 * * * *", "2 * * * *"], // every hour at 0th, 1st and 2nd minute
        },
      },
    });

    setCurrentSystemTime("2023-08-16T01:02:01");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T01:01:30");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(messages[0].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
    expect(messages[1].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
    expect(messages[2].message).to.match(SHOULD_UPDATE_REGEXP);
  });

  it("should return true if two of multiple cron expressions fulfilled", () => {
    mockEnvVariables({
      updateTriggers: {
        ETH: {
          cron: ["0 * * * *", "1 * * * *", "2 * * * *"], // every hour at 0th, 1st and 2nd minute
        },
      },
    });

    setCurrentSystemTime("2023-08-16T01:01:01");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T01:00:30");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.true;
    expect(messages[0].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
    expect(messages[1].message).to.match(SHOULD_UPDATE_REGEXP);
    expect(messages[2].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
  });

  it("should return false if none of multiple cron expressions fulfilled", () => {
    mockEnvVariables({
      updateTriggers: {
        ETH: {
          cron: ["0 * * * *", "1 * * * *", "2 * * * *"], // every hour at 0th, 1st and 2nd minute
        },
      },
    });

    setCurrentSystemTime("2023-08-16T01:05:01");
    const lastUpdateTimestamp = dateStrToMilliseconds("2023-08-16T01:03:30");
    const { shouldUpdatePrices, messages } = cronCondition(
      "ETH",
      lastUpdateTimestamp,
      config()
    );
    expect(shouldUpdatePrices).to.be.false;
    expect(messages[0].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
    expect(messages[1].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
    expect(messages[2].message).to.match(SHOULD_NOT_UPDATE_REGEXP);
  });
});

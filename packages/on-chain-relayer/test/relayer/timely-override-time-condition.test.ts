import { RedstoneCommon } from "@redstone-finance/utils";
import { expect } from "chai";
import { config, timelyOverrideSinceLastUpdate } from "../../src/config";
import { mockEnvVariables } from "../helpers";

describe("timely override time condition", () => {
  it("should temporary set update interval when time conditions exists", async () => {
    mockEnvVariables({
      updateConditions: {
        ETH: ["value-deviation", "time"],
        BTC: ["value-deviation", "time"],
      },
      updateTriggers: {
        ETH: {
          deviationPercentage: 10,
          timeSinceLastUpdateInMilliseconds: 1000,
        },
        BTC: {
          deviationPercentage: 10,
          timeSinceLastUpdateInMilliseconds: 1000,
        },
      },
    });
    expect(
      config().updateTriggers["ETH"].timeSinceLastUpdateInMilliseconds
    ).to.equal(1_000);
    expect(config().updateConditions["ETH"]).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    timelyOverrideSinceLastUpdate(1);

    expect(
      config().updateTriggers["ETH"].timeSinceLastUpdateInMilliseconds
    ).to.equal(1);
    expect(config().updateConditions["ETH"]).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    await RedstoneCommon.sleep(2);

    expect(
      config().updateTriggers["ETH"].timeSinceLastUpdateInMilliseconds
    ).to.equal(1_000);
    expect(config().updateConditions["ETH"]).to.deep.equal([
      "value-deviation",
      "time",
    ]);
  });

  it("should temporary set update interval when time conditions DOES NOT exists", async () => {
    mockEnvVariables({
      updateConditions: {
        ETH: ["value-deviation", "time"],
        BTC: ["value-deviation"],
      },
      updateTriggers: {
        ETH: {
          deviationPercentage: 10,
          timeSinceLastUpdateInMilliseconds: 1000,
        },
        BTC: {
          deviationPercentage: 10,
        },
      },
    });
    expect(config().updateConditions["BTC"]).to.deep.equal(["value-deviation"]);
    expect(
      config().updateTriggers["BTC"].timeSinceLastUpdateInMilliseconds
    ).to.equal(undefined);

    timelyOverrideSinceLastUpdate(1);

    expect(
      config().updateTriggers["BTC"].timeSinceLastUpdateInMilliseconds
    ).to.equal(1);
    expect(config().updateConditions["BTC"]).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    await RedstoneCommon.sleep(2);

    expect(
      config().updateTriggers["BTC"].timeSinceLastUpdateInMilliseconds
    ).to.equal(undefined);
    expect(config().updateConditions["BTC"]).to.deep.equal(["value-deviation"]);
  });
});

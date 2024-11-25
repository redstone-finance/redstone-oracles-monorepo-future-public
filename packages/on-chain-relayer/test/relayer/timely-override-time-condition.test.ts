import { RedstoneCommon } from "@redstone-finance/utils";
import { expect } from "chai";
import { timelyOverrideSinceLastUpdate } from "../../src/config/timely-override-since-last-update";
import { mockConfig } from "../helpers";

describe("timely override time condition", () => {
  it("should temporary set update interval when time conditions exists", async () => {
    const relayerConfig = mockConfig({
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
      relayerConfig.updateTriggers["ETH"].timeSinceLastUpdateInMilliseconds
    ).to.equal(1_000);
    expect(relayerConfig.updateConditions["ETH"]).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    timelyOverrideSinceLastUpdate(relayerConfig, 1);

    expect(
      relayerConfig.updateTriggers["ETH"].timeSinceLastUpdateInMilliseconds
    ).to.equal(1);
    expect(relayerConfig.updateConditions["ETH"]).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    await RedstoneCommon.sleep(2);

    expect(
      relayerConfig.updateTriggers["ETH"].timeSinceLastUpdateInMilliseconds
    ).to.equal(1_000);
    expect(relayerConfig.updateConditions["ETH"]).to.deep.equal([
      "value-deviation",
      "time",
    ]);
  });

  it("should temporary set update interval when time conditions DOES NOT exists", async () => {
    const relayerConfig = mockConfig({
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

    expect(relayerConfig.updateConditions["BTC"]).to.deep.equal([
      "value-deviation",
    ]);
    expect(
      relayerConfig.updateTriggers["BTC"].timeSinceLastUpdateInMilliseconds
    ).to.equal(undefined);

    timelyOverrideSinceLastUpdate(relayerConfig, 1);

    expect(
      relayerConfig.updateTriggers["BTC"].timeSinceLastUpdateInMilliseconds
    ).to.equal(1);
    expect(relayerConfig.updateConditions["BTC"]).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    await RedstoneCommon.sleep(2);

    expect(
      relayerConfig.updateTriggers["BTC"].timeSinceLastUpdateInMilliseconds
    ).to.equal(undefined);
    expect(relayerConfig.updateConditions["BTC"]).to.deep.equal([
      "value-deviation",
    ]);
  });
});

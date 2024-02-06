import { expect } from "chai";
import { config, timelyOverrideSinceLastUpdate } from "../../src/config";
import { mockEnvVariables } from "../helpers";
import { RedstoneCommon } from "@redstone-finance/utils";

describe("timely override time condition", () => {
  it("should temporary set update interval when time conditions exists", async () => {
    mockEnvVariables({
      updateConditions: ["value-deviation", "time"],
      updatePriceInterval: 1_000,
    });
    expect(config().updatePriceInterval).to.equal(1_000);
    expect(config().updateConditions).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    timelyOverrideSinceLastUpdate(1);

    expect(config().updatePriceInterval).to.equal(1);
    expect(config().updateConditions).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    await RedstoneCommon.sleep(2);

    expect(config().updatePriceInterval).to.equal(1_000);
    expect(config().updateConditions).to.deep.equal([
      "value-deviation",
      "time",
    ]);
  });

  it("should temporary set update interval when time conditions DOES NOT exists", async () => {
    mockEnvVariables({
      updateConditions: ["value-deviation"],
      updatePriceInterval: undefined,
    });
    expect(config().updateConditions).to.deep.equal(["value-deviation"]);
    expect(config().updatePriceInterval).to.equal(undefined);

    timelyOverrideSinceLastUpdate(1);

    expect(config().updatePriceInterval).to.equal(1);
    expect(config().updateConditions).to.deep.equal([
      "value-deviation",
      "time",
    ]);

    await RedstoneCommon.sleep(2);

    expect(config().updatePriceInterval).to.equal(undefined);
    expect(config().updateConditions).to.deep.equal(["value-deviation"]);
  });
});

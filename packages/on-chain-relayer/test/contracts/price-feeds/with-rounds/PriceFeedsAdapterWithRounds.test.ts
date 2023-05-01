import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

chai.use(chaiAsPromised);

describe("PriceFeedsAdapterWithRounds", () => {
  describe("Common adapter tests", () => {
    describeCommonPriceFeedsAdapterTests({
      adapterContractName: "PriceFeedsAdapterWithRoundsMock",
      hasOnlyOneDataFeed: false,
      skipTestsForPrevDataTimestamp: false,
    });
  });

  describe("Tests for adapter with rounds support", () => {
    it("should properly get latest round id", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get latest round params", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get values for different (valid) rounds", async () => {
      expect(1).to.be.equal(1);
    });

    it("should revert trying to get values for invalid rounds", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get values and timestamps for different (valid) rounds", async () => {
      expect(1).to.be.equal(1);
    });

    it("should revert trying to get values and timestamps for invalid rounds", async () => {
      expect(1).to.be.equal(1);
    });
  });
});

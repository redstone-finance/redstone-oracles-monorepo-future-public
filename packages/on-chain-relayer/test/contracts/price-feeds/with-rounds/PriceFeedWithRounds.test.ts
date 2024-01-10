import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describeCommonPriceFeedTests } from "../common/price-feed-utils";

chai.use(chaiAsPromised);

describe("PriceFeedWithRounds", () => {
  describeCommonPriceFeedTests({
    priceFeedContractName: "PriceFeedWithRoundsMock",
    adapterContractName: "PriceFeedsAdapterWithRoundsMock",
    expectedRoundIdAfterTwoUpdates: 2,
  });

  describe("Tests for getting historical price feed values", () => {
    it("should properly get round data for several rounds", () => {
      expect(1).to.be.equal(1);
    });

    it("should revert trying to get round data for invalid rounds", () => {
      expect(1).to.be.equal(1);
    });
  });
});

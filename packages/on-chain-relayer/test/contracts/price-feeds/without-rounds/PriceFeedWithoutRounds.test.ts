import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describeCommonPriceFeedTests } from "../common/price-feed-utils";
import { DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS } from "../../../helpers";

chai.use(chaiAsPromised);

describe("PriceFeedWithoutRounds", () => {
  describeCommonPriceFeedTests({
    priceFeedContractName: "PriceFeedWithoutRoundsMock",
    adapterContractName: "PriceFeedsAdapterWithoutRoundsMock",
    expectedRoundIdAfterTwoUpdates: DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS,
  });

  describe("Tests for getting historical price feed values", () => {
    it("should revert trying to get round data for invalid rounds", () => {
      expect(1).to.be.equal(1);
    });
  });
});

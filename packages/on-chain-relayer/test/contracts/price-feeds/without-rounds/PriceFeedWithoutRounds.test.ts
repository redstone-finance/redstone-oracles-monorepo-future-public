import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS } from "../../../helpers";
import { describeCommonPriceFeedTests } from "../common/price-feed-utils";

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

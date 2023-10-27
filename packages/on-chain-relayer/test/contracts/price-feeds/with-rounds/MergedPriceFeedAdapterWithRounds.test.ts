import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { describeCommonPriceFeedTests } from "../common/price-feed-utils";
import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

chai.use(chaiAsPromised);

describe("PriceFeedWithRounds", () => {
  describeCommonPriceFeedTests({
    priceFeedContractName: "MergedPriceFeedAdapterWithRoundsMock",
    adapterContractName: "MergedPriceFeedAdapterWithRoundsMock",
    expectedRoundIdAfterOneUpdate: 1,
  });

  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "MergedPriceFeedAdapterWithRoundsMock",
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
  });
});

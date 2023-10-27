import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { describeCommonPriceFeedTests } from "../common/price-feed-utils";
import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

chai.use(chaiAsPromised);

describe("MergedPriceFeedAdapterWithoutRounds", () => {
  describeCommonPriceFeedTests({
    priceFeedContractName: "MergedPriceFeedAdapterWithoutRoundsMock",
    adapterContractName: "MergedPriceFeedAdapterWithoutRoundsMock",
    expectedRoundIdAfterOneUpdate: 0,
  });

  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "MergedPriceFeedAdapterWithoutRoundsMock",
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
  });
});

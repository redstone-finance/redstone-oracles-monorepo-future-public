import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

describe("SinglePriceFeedAdapterWithClearing", () => {
  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "SinglePriceFeedAdapterWithClearingMock",
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: true,
  });
});

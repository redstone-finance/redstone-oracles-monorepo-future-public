import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

describe("SinglePriceFeedAdapter", () => {
  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "SinglePriceFeedAdapterMock",
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
  });
});

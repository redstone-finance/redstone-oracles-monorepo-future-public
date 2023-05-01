import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

describe("PriceFeedsAdapterWithRounds", () => {
  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "PriceFeedsAdapterWithRoundsMock",
    hasOnlyOneDataFeed: false,
    skipTestsForPrevDataTimestamp: false,
  });
});

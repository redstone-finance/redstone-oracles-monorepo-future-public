import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { describeCommonPriceFeedTests } from "../common/price-feed-utils";
import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";
import { describeCommonMergedPriceFeedAdapterTests } from "../common/merged-price-feed-adapter-utils";
import { DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS } from "../../../helpers";

chai.use(chaiAsPromised);

const contractName = "MergedPriceFeedAdapterWithoutRoundsMock";

describe("MergedPriceFeedAdapterWithoutRounds", () => {
  describeCommonPriceFeedTests({
    priceFeedContractName: contractName,
    adapterContractName: contractName,
    expectedRoundIdAfterTwoUpdates: DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS,
  });

  describeCommonPriceFeedsAdapterTests({
    adapterContractName: contractName,
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
  });

  describeCommonMergedPriceFeedAdapterTests({
    mergedPriceFeedAdapterContractName: contractName,
    updatedContractName: "MergedPriceFeedAdapterWithoutRoundsUpdatedMock",
    roundsEndabled: false,
  });
});

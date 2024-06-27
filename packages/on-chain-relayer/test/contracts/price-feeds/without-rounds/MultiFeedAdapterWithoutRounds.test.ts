import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS } from "../../../helpers";
import { describeCommonMultiFeedAdapterTests } from "../common/multi-feed-adapter-utils";
import { describeCommonPriceFeedTests } from "../common/price-feed-utils";

chai.use(chaiAsPromised);

const contractName = "MultiFeedAdapterWithoutRoundsMock";

describe("MultiFeedAdapterWithoutRounds", () => {
  describeCommonMultiFeedAdapterTests(contractName);

  describeCommonPriceFeedTests({
    priceFeedContractName: "PriceFeedWithoutRoundsForMultiFeedAdapterMock",
    adapterContractName: contractName,
    expectedRoundIdAfterTwoUpdates: DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS,
    isMultiFeedAdapter: true,
  });
});

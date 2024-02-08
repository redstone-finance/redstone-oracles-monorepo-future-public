import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { describeCommonPriceFeedsAdapterTests } from "../common/price-feeds-adapter-utils";

chai.use(chaiAsPromised);

describe("LayerBankOracleAdapterMock", () => {
  describeCommonPriceFeedsAdapterTests({
    adapterContractName: "LayerBankOracleAdapterMock",
    hasOnlyOneDataFeed: false,
    skipTestsForPrevDataTimestamp: false,
  });
});

import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import {
  FluidMock,
  FluidOracleRedstoneAdapterMock,
} from "../../../../typechain-types";
import { describeCommonPriceFeedsAdapterTests } from "../../price-feeds/common/price-feeds-adapter-utils";

chai.use(chaiAsPromised);

const adapterContractName = "FluidOracleRedstoneAdapterMock";

describe("EthUsdcRedstoneAdapterForFluidOracle", () => {
  describeCommonPriceFeedsAdapterTests({
    adapterContractName,
    hasOnlyOneDataFeed: true,
    skipTestsForPrevDataTimestamp: false,
    dataFeedId: "ETH/USDC",
  });

  describe("EthUsdcRedstoneAdapterForFluidOracle specific", () => {
    let adapterContract: FluidOracleRedstoneAdapterMock;

    beforeEach(async () => {
      // Deploy a new adapter contract
      const adapterContractFactory =
        await ethers.getContractFactory(adapterContractName);
      adapterContract = await adapterContractFactory.deploy();
    });

    it("getExchangeRate return 0, when value not set", async () => {
      const value = await adapterContract.getExchangeRate();

      expect(value.toString()).to.eq("0");
    });

    it("getExchangeRate return set value", async () => {
      const currentBlockTime = await time.latest();
      const nextBlockTime = currentBlockTime + 1;

      const wrappedContract = WrapperBuilder.wrap(
        adapterContract
      ).usingSimpleNumericMock({
        timestampMilliseconds: nextBlockTime * 1000,
        dataPoints: [{ dataFeedId: "ETH/USDC", value: 42 }],
        mockSignersCount: 2,
      });

      await time.setNextBlockTimestamp(nextBlockTime);
      await wrappedContract.updateDataFeedsValues(nextBlockTime * 1000);

      const value = await adapterContract.getExchangeRate();

      expect(value.toString()).to.eq("4200000000");
    });

    it("benchmark reads", async () => {
      const fluidMock = (await ethers.deployContract("FluidMock", [
        adapterContract.address,
      ])) as FluidMock;

      await fluidMock.optimizedGetExchangesRate();
      await fluidMock.normalGetExchangesRate();
    });
  });
});

import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { MergedAdapterWithoutRoundsSusdeRateProviderBase } from "../../../../typechain-types";

chai.use(chaiAsPromised);

const defaultTestValues = {
  sUSDe_RATE_PROVIDER: 10355953050.17573,
};

describe("MergedAdapterWithoutRoundsSusdeRateProviderBase", () => {
  let mergedAdapterSusde: MergedAdapterWithoutRoundsSusdeRateProviderBase;

  const updatePrices = async (
    prices: Record<string, number>,
    addedTimeInSeconds: number = 0
  ) => {
    const dataPoints = Object.entries(prices).map(([dataFeedId, value]) => ({
      dataFeedId,
      value,
    }));
    const prevBlockTime = await time.latest();
    const curBlockTime = prevBlockTime + addedTimeInSeconds + 10;
    const mockDataTimestamp = (prevBlockTime + addedTimeInSeconds) * 1000;
    await time.setNextBlockTimestamp(curBlockTime);
    const wrappedAdapter = WrapperBuilder.wrap(
      mergedAdapterSusde
    ).usingSimpleNumericMock({
      mockSignersCount: 2,
      dataPoints,
      timestampMilliseconds: mockDataTimestamp,
    });
    const tx = await wrappedAdapter.updateDataFeedsValues(mockDataTimestamp);
    await tx.wait();
  };

  beforeEach(async () => {
    const mergedAdapterSusdeFactory = await ethers.getContractFactory(
      "MergedAdapterWithoutRoundsSusdeRateProviderMock"
    );
    mergedAdapterSusde = await mergedAdapterSusdeFactory.deploy();
    await mergedAdapterSusde.deployed();
  });

  it("should allow first update", async () => {
    await updatePrices(defaultTestValues);
  });

  it("should allow second update (with the same value) if more than 12 hours passed", async () => {
    await updatePrices(defaultTestValues);
    const THIRTEEN_HOURS_IN_SECONDS = 60 * 60 * 13;
    await updatePrices(defaultTestValues, THIRTEEN_HOURS_IN_SECONDS);
  });

  it("should revert getRate function before the first update", async () => {
    await expect(mergedAdapterSusde.getRate()).to.be.revertedWith(
      "DataFeedValueCannotBeZero"
    );
  });

  it("should read proper value using getRate function", async () => {
    await updatePrices(defaultTestValues);
    const getRateResponse = await mergedAdapterSusde.getRate();
    expect(getRateResponse.toString()).to.eq("1035595305017572975");
  });

  it("should allow second update when new value is deviated less than 2% - lesser", async () => {
    await updatePrices(defaultTestValues);
    const THIRTEEN_HOURS_IN_SECONDS = 60 * 60 * 13;
    await updatePrices(
      {
        ...defaultTestValues,
        sUSDe_RATE_PROVIDER: 10459512580.67748,
      },
      THIRTEEN_HOURS_IN_SECONDS
    );
  });

  it("should allow second update when new value is deviated less than 2% - bigger", async () => {
    await updatePrices(defaultTestValues);
    const THIRTEEN_HOURS_IN_SECONDS = 60 * 60 * 13;
    await updatePrices(
      {
        ...defaultTestValues,
        sUSDe_RATE_PROVIDER: 10252393519.67397,
      },
      THIRTEEN_HOURS_IN_SECONDS
    );
  });

  it("shouldn't allow second update if less than 12 hours passed", async () => {
    await updatePrices(defaultTestValues);
    const SIX_HOURS_IN_SECONDS = 60 * 60 * 6;
    await expect(
      updatePrices(defaultTestValues, SIX_HOURS_IN_SECONDS)
    ).to.be.revertedWith("MinIntervalBetweenUpdatesHasNotPassedYet");
  });

  it("shouldn't allow second update when new value is deviated more than 2% - lesser", async () => {
    await updatePrices(defaultTestValues);
    const THIRTEEN_HOURS_IN_SECONDS = 60 * 60 * 13;
    await expect(
      updatePrices(
        {
          ...defaultTestValues,
          sUSDe_RATE_PROVIDER: 9838155397.66694,
        },
        THIRTEEN_HOURS_IN_SECONDS
      )
    ).to.be.revertedWith("ProposedValueIsDeviatedTooMuch");
  });

  it("shouldn't allow second update when new value is deviated more than 2% - bigger", async () => {
    await updatePrices(defaultTestValues);
    const THIRTEEN_HOURS_IN_SECONDS = 60 * 60 * 13;
    await expect(
      updatePrices(
        {
          ...defaultTestValues,
          sUSDe_RATE_PROVIDER: 10770191172.18276,
        },
        THIRTEEN_HOURS_IN_SECONDS
      )
    ).to.be.revertedWith("ProposedValueIsDeviatedTooMuch");
  });
});

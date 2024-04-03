import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { LayerBankOracleAdapterV1 } from "../../../../typechain-types";

chai.use(chaiAsPromised);

const defaultTestValues = {
  ETH: 2000,
  USDC: 1,
  TIA: 42,
  "LAB.m": 42,
  wstETH: 42,
  STONE: 42,
  wUSDM: 1,
  MANTA: 424444,
};

const assetAddresses = {
  ETH: "0x0000000000000000000000000000000000000000",
  USDC: "0xb73603C5d87fA094B7314C74ACE2e64D165016fb",
  TIA: "0x6Fae4D9935E2fcb11fC79a64e917fb2BF14DaFaa",
  "LAB.m": "0x20A512dbdC0D006f46E6cA11329034Eb3d18c997",
  wstETH: "0x2FE3AD97a60EB7c79A976FC18Bb5fFD07Dd94BA5",
  STONE: "0xEc901DA9c68E90798BbBb74c11406A32A70652C3",
  wUSDM: "0xbdAd407F77f44F7Da6684B416b1951ECa461FB07",
  MANTA: "0x95CeF13441Be50d20cA4558CC0a27B601aC544E5",
};
const invalidAddress = "0x1234567891Be50d20cA4558CC0a27B6123456789";

describe("LayerBankOracleAdapterV1", () => {
  let layerBankAdapter: LayerBankOracleAdapterV1;

  // This function uses 18 decimals, all LayerBank feeds have 18 decimals as well
  const formatDecimals = (value: number) =>
    ethers.utils.parseEther(String(value));

  const updatePrices = async (prices: Record<string, number>) => {
    const dataPoints = Object.entries(prices).map(([dataFeedId, value]) => ({
      dataFeedId,
      value,
    }));
    const prevBlockTime = await time.latest();
    const curBlockTime = prevBlockTime + 10;
    const mockDataTimestamp = prevBlockTime * 1000;
    await time.setNextBlockTimestamp(curBlockTime);
    const wrappedAdapter = WrapperBuilder.wrap(
      layerBankAdapter
    ).usingSimpleNumericMock({
      mockSignersCount: 2,
      dataPoints,
      timestampMilliseconds: mockDataTimestamp,
    });
    const tx = await wrappedAdapter.updateDataFeedsValues(mockDataTimestamp);
    await tx.wait();
  };

  beforeEach(async () => {
    const LayerBankOracleAdapterV1Factory = await ethers.getContractFactory(
      "LayerBankOracleAdapterV1Mock"
    );
    layerBankAdapter = await LayerBankOracleAdapterV1Factory.deploy();
    await layerBankAdapter.deployed();
  });

  it("Should not update values if at least one feed is missing", async () => {
    const { ETH: _, ...incompleteValues } = defaultTestValues;
    await expect(updatePrices(incompleteValues)).to.be.reverted;
  });

  it("Should properly update values one time", async () => {
    await updatePrices(defaultTestValues);
  });

  it("Should fail trying to update any feed with 0 value", async () => {
    await expect(
      updatePrices({ ...defaultTestValues, wUSDM: 0 })
    ).to.be.revertedWith("DataFeedValueCannotBeZero");
  });

  it("Should properly update values several times", async () => {
    for (let i = 0; i < 10; i++) {
      const testValues: Record<string, number> = {
        ...defaultTestValues,
        USDC: i + 1,
        MANTA: 1 + 42 * i,
      };
      await updatePrices(testValues);
      const prices = await layerBankAdapter.pricesOf(
        Object.values(assetAddresses)
      );
      for (let i = 0; i < prices.length; i++) {
        const dataFeedId = Object.keys(assetAddresses)[i];
        expect(prices[i]).to.eq(formatDecimals(testValues[dataFeedId]));
      }
    }
  });

  it("Should get values using priceOf", async () => {
    await updatePrices(defaultTestValues);
    for (const [dataFeedId, assetAddress] of Object.entries(assetAddresses)) {
      const price = await layerBankAdapter.priceOf(assetAddress);
      const dataFeedIdKey = dataFeedId as keyof typeof defaultTestValues;
      expect(price).to.eq(formatDecimals(defaultTestValues[dataFeedIdKey]));
    }
  });

  it("Should get values using pricesOf", async () => {
    await updatePrices(defaultTestValues);
    const prices = await layerBankAdapter.pricesOf([
      assetAddresses.USDC,
      assetAddresses.ETH,
      assetAddresses.MANTA,
    ]);
    expect(prices.length).to.eq(3);
    expect(prices[0]).to.eq(formatDecimals(defaultTestValues.USDC));
    expect(prices[1]).to.eq(formatDecimals(defaultTestValues.ETH));
    expect(prices[2]).to.eq(formatDecimals(defaultTestValues.MANTA));
  });

  it("Should get price of ETH using priceOfETH", async () => {
    const ethTestPrice = 42424242;
    await updatePrices({ ...defaultTestValues, ETH: ethTestPrice });
    const ethPrice = await layerBankAdapter.priceOf(assetAddresses.ETH);
    expect(ethPrice).to.eq(formatDecimals(ethTestPrice));
  });

  it("Should fail if the data is stale", async () => {
    await updatePrices(defaultTestValues);
    await layerBankAdapter.priceOf(assetAddresses.ETH);
    const prevBlockTime = await time.latest();
    await time.setNextBlockTimestamp(prevBlockTime + 10 * 3600 + 1);
    await mine();
    await expect(
      layerBankAdapter.priceOf(assetAddresses.ETH)
    ).to.be.revertedWith("DataIsStale");
  });

  it("Should revert for getting 0 values", async () => {
    await expect(layerBankAdapter.priceOf(invalidAddress)).to.be.reverted;
    await expect(
      layerBankAdapter.pricesOf([assetAddresses.ETH, assetAddresses.MANTA])
    ).to.be.reverted;
  });

  it("Should revert for an unknown asset", async () => {
    await updatePrices(defaultTestValues);
    await expect(layerBankAdapter.priceOf(invalidAddress)).to.be.reverted;
    await expect(
      layerBankAdapter.pricesOf([assetAddresses.ETH, invalidAddress])
    ).to.be.reverted;
  });

  it("Should get underlying price", async () => {
    await updatePrices(defaultTestValues);
    const price = await layerBankAdapter.getUnderlyingPrice(
      "0x0000000000000000000000000000000000000002"
    );
    expect(price).to.eq(formatDecimals(defaultTestValues.MANTA));
  });

  it("Should get underlying prices", async () => {
    await updatePrices(defaultTestValues);
    const prices = await layerBankAdapter.getUnderlyingPrices([
      "0x0000000000000000000000000000000000000002",
      "0x0000000000000000000000000000000000000001",
    ]);
    expect(prices.length).to.eq(2);
    expect(prices[0]).to.eq(formatDecimals(defaultTestValues.MANTA));
    expect(prices[1]).to.eq(formatDecimals(defaultTestValues.ETH));
  });

  it("Should fail getting underlying prices for an invalid gToken", async () => {
    await updatePrices(defaultTestValues);
    await expect(
      layerBankAdapter.getUnderlyingPrice(
        "0x0000000000000000000000000000000000000003"
      )
    ).to.be.revertedWith("InvalidGToken");
  });

  it("Should properly connect PriceFeedWithRounds", async () => {
    // Deploy price feed
    const PriceFeedWithRoundsEthMockFactory = await ethers.getContractFactory(
      "PriceFeedWithRoundsEthMock"
    );
    const priceFeed = await PriceFeedWithRoundsEthMockFactory.deploy();
    await priceFeed.deployed();

    // Connect the price feed to layer bank adapter
    const tx = await priceFeed.setAdapterAddress(layerBankAdapter.address);
    await tx.wait();

    // Check basic PriceFeed functions after one prices update
    await updatePrices(defaultTestValues);
    expect(await priceFeed.latestRound()).to.eq(1);
    expect(await priceFeed.latestAnswer()).to.eq(
      defaultTestValues.ETH * 10 ** 8
    );

    // Check basic PriceFeed functions after another prices update
    await updatePrices({ ...defaultTestValues, ETH: 1234 });
    expect(await priceFeed.latestRound()).to.eq(2);
    expect(await priceFeed.latestAnswer()).to.eq(1234 * 10 ** 8);
  });
});

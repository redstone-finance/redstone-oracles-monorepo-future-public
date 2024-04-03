import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import {
  IRedstoneAdapter,
  PriceFeedWithRoundsMock,
  PriceFeedWithoutRoundsMock,
  PriceFeedsAdapterWithRoundsMock,
} from "../../../../typechain-types";
import { DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS } from "../../../helpers";

chai.use(chaiAsPromised);

describe("upgrade from contracts without rounds to contracts with rounds", () => {
  let adapterWithoutRounds: IRedstoneAdapter;
  let priceFeedWithoutRounds: PriceFeedWithoutRoundsMock;

  beforeEach(async () => {
    const adapterContractFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterWithoutRoundsMock"
    );

    adapterWithoutRounds = (await upgrades.deployProxy(
      adapterContractFactory
    )) as IRedstoneAdapter;

    const priceFeedFactory = await ethers.getContractFactory(
      "PriceFeedWithoutRoundsMock"
    );
    priceFeedWithoutRounds = (await upgrades.deployProxy(
      priceFeedFactory
    )) as PriceFeedWithoutRoundsMock;

    await priceFeedWithoutRounds.setAdapterAddress(
      adapterWithoutRounds.address
    );
  });

  it("should updates prices and read using priceFeed", async () => {
    // update price ten times
    for (let i = 0; i < 10; i++) {
      const value = 123 + i;
      const { timestamp } = await updatePriceInAdapter(
        adapterWithoutRounds,
        value
      );
      await assertCommonPriceFeedWorks(
        priceFeedWithoutRounds,
        DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS.toString(),
        value
      );
      await assertCommonAdapterWorks(adapterWithoutRounds, timestamp, value);
    }

    // update only adapter to WithRound version and assert that it will work with price feed WithOutRounds
    const adapterWithRounds = (await upgrades.upgradeProxy(
      adapterWithoutRounds,
      await ethers.getContractFactory("PriceFeedsAdapterWithRoundsMock")
    )) as PriceFeedsAdapterWithRoundsMock;
    const expectedRoundsData = [];
    for (let i = 1; i < 11; i++) {
      const value = 1337 + i;
      const { timestamp, blockTimestamp } = await updatePriceInAdapter(
        adapterWithRounds,
        value
      );
      await assertCommonPriceFeedWorks(
        priceFeedWithoutRounds,
        DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS.toString(),
        value
      );
      await assertCommonAdapterWorks(adapterWithRounds, timestamp, value);
      const args = {
        expectedRound: i.toString(),
        timestamp,
        value,
        blockTimestamp,
      };
      expectedRoundsData.push(args);
      await assertAdapterWithRoundsWorks(
        adapterWithRounds,
        args.expectedRound,
        args.timestamp,
        args.value,
        args.blockTimestamp
      );
    }

    // check if next round doesn't override previous one
    for (const expectedRoundData of expectedRoundsData) {
      expect(
        await mapToString(
          adapterWithRounds.getRoundDataFromAdapter(
            formatBytes32String("BTC"),
            expectedRoundData.expectedRound
          )
        )
      ).deep.eq([
        (expectedRoundData.value * 1e8).toString(),
        expectedRoundData.timestamp,
        expectedRoundData.blockTimestamp,
      ]);
    }

    // next update price feed to WithRound version
    const priceFeedWithRounds = (await upgrades.upgradeProxy(
      priceFeedWithoutRounds,
      await ethers.getContractFactory("PriceFeedWithRoundsMock")
    )) as PriceFeedWithRoundsMock;

    const expectedRoundsDataAfterUpdatingPriceFeed = [];
    for (let i = 11; i < 21; i++) {
      const value = 1337 + i;
      const { timestamp, blockTimestamp } = await updatePriceInAdapter(
        adapterWithRounds,
        value
      );
      await assertCommonPriceFeedWorks(
        priceFeedWithRounds,
        i.toString(),
        value
      );
      await assertCommonAdapterWorks(adapterWithRounds, timestamp, value);
      const args = {
        expectedRound: i.toString(),
        timestamp,
        value,
        blockTimestamp,
      };
      expectedRoundsDataAfterUpdatingPriceFeed.push(args);
      await assertAdapterWithRoundsWorks(
        adapterWithRounds,
        args.expectedRound,
        args.timestamp,
        args.value,
        args.blockTimestamp
      );
      await assertPriceFeedWithRoundsWorks(
        priceFeedWithRounds,
        args.expectedRound,
        value,
        Math.floor(parseInt(args.timestamp) / 1000).toString(),
        args.blockTimestamp
      );
    }

    // check if price feed doesnt override state
    for (const expectedRoundData of expectedRoundsDataAfterUpdatingPriceFeed) {
      expect(
        await mapToString(
          priceFeedWithRounds.getRoundData(expectedRoundData.expectedRound)
        )
        // roundId: BigNumber;
        // answer: BigNumber;
        // startedAt: BigNumber;
        // updatedAt: BigNumber;
        // answeredInRound: BigNumber;
      ).deep.eq([
        expectedRoundData.expectedRound,
        (expectedRoundData.value * 1e8).toString(),
        Math.floor(parseInt(expectedRoundData.timestamp) / 1e3).toString(),
        expectedRoundData.blockTimestamp,
        expectedRoundData.expectedRound,
      ]);
    }
  });
});

async function assertCommonAdapterWorks(
  wrappedContract: IRedstoneAdapter,
  timestamp: string,
  value: number
) {
  expect(
    await mapToString(
      wrappedContract.getValuesForDataFeeds([formatBytes32String("BTC")])
    )
  ).deep.eq([(value * 1e8).toString()]);
  expect(await wrappedContract.getBlockTimestampFromLatestUpdate()).to.eq(
    (await time.latest()).toString()
  );
  expect(await wrappedContract.getDataFeedIds()).deep.eq([
    formatBytes32String("BTC"),
  ]);
  expect(
    await wrappedContract.getDataFeedIndex(formatBytes32String("BTC"))
  ).to.eq("0");
  expect(await wrappedContract.getDataTimestampFromLatestUpdate()).to.eq(
    timestamp
  );
  expect(await wrappedContract.getMinIntervalBetweenUpdates()).to.eq("3");
}

async function updatePriceInAdapter(
  adapterWithoutRounds: IRedstoneAdapter,
  value: number
) {
  await time.increase(4);
  const timestamp = ((await time.latest()) + 50) * 1000;
  const wrappedContract = WrapperBuilder.wrap(
    adapterWithoutRounds
  ).usingSimpleNumericMock({
    mockSignersCount: 2,
    timestampMilliseconds: timestamp,
    dataPoints: [
      {
        dataFeedId: "BTC",
        value,
      },
    ],
  });

  // round 1
  await wrappedContract.updateDataFeedsValues(timestamp);
  return {
    wrappedContract,
    timestamp: timestamp.toString(),
    blockTimestamp: (await time.latest()).toString(),
  };
}

async function assertCommonPriceFeedWorks(
  priceFeedWithoutRounds: PriceFeedWithoutRoundsMock,
  expectedRound: string,
  expectedPrice: number
) {
  expect(await priceFeedWithoutRounds.getDataFeedId()).to.eq(
    formatBytes32String("BTC")
  );
  expect(await priceFeedWithoutRounds.latestRound()).to.eq(expectedRound);
  const blockTime = await time.latest();
  const expectedPriceScaled = (expectedPrice * 1e8).toString();
  expect(await priceFeedWithoutRounds.latestAnswer()).to.eq(
    expectedPriceScaled
  );

  expect(await mapToString(priceFeedWithoutRounds.latestRoundData())).deep.eq([
    expectedRound,
    expectedPriceScaled,
    blockTime.toString(),
    blockTime.toString(),
    expectedRound,
  ]);
}

async function assertPriceFeedWithRoundsWorks(
  priceFeedWithoutRounds: PriceFeedWithoutRoundsMock,
  expectedRound: string,
  expectedPrice: number,
  timestamp: string,
  blockTimestamp: string
) {
  const expectedPriceScaled = (expectedPrice * 1e8).toString();
  expect(
    await mapToString(priceFeedWithoutRounds.getRoundData(expectedRound))
  ).deep.eq([
    expectedRound,
    expectedPriceScaled,
    timestamp,
    blockTimestamp,
    expectedRound,
  ]);
}

async function assertAdapterWithRoundsWorks(
  adapterWithRounds: PriceFeedsAdapterWithRoundsMock,
  expectedRound: string,
  timestamp: string,
  expectedValue: number,
  blockTime: string
) {
  const expectedPriceScaled = (expectedValue * 1e8).toString();

  expect(await adapterWithRounds.getLatestRoundId()).to.eq(expectedRound);
  expect(await mapToString(adapterWithRounds.getLatestRoundParams())).deep.eq([
    expectedRound,
    timestamp,
    blockTime,
  ]);

  expect(
    await adapterWithRounds.getValueForDataFeedAndRound(
      formatBytes32String("BTC"),
      expectedRound
    )
  ).to.eq(expectedPriceScaled);
  expect(
    await mapToString(
      adapterWithRounds.getRoundDataFromAdapter(
        formatBytes32String("BTC"),
        expectedRound
      )
    )
  ).deep.eq([expectedPriceScaled, timestamp, blockTime]);
}

async function mapToString(arr: Promise<BigNumber[]>) {
  return (await arr).map((bg) => bg.toString());
}

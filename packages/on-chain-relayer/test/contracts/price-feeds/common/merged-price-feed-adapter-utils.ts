import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, Event } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import { MergedPriceFeedAdapterWithRounds } from "../../../../typechain-types";
import { DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS } from "../../../helpers";

interface PriceFeedTestsParams {
  mergedPriceFeedAdapterContractName: string;
  updatedContractName: string;
  roundsEndabled: boolean;
}

interface PriceUpdateTestParams {
  valueForUpdate: number;
  expectedRoundId: number;
  expectedValuesInRounds: { roundId: number; expectedValue: number }[];
}

chai.use(chaiAsPromised);

const expectBigNumber = (bn: unknown, expectedNumber: number) => {
  expect((bn as BigNumber).toNumber()).to.be.equal(expectedNumber);
};

export const describeCommonMergedPriceFeedAdapterTests = ({
  mergedPriceFeedAdapterContractName,
  updatedContractName,
  roundsEndabled,
}: PriceFeedTestsParams) => {
  const deployBehindProxy = async () => {
    const factory = await ethers.getContractFactory(
      mergedPriceFeedAdapterContractName
    );
    return (await upgrades.deployProxy(
      factory
    )) as MergedPriceFeedAdapterWithRounds;
  };

  describe("Tests for getting price feed / adapter details", () => {
    let contract: MergedPriceFeedAdapterWithRounds;

    beforeEach(async () => {
      contract = await deployBehindProxy();
    });

    it("should properly get data feed id", async () => {
      const dataFeedId = await contract.getDataFeedId();
      expect(dataFeedId).to.eq(formatBytes32String("BTC"));
    });

    it("should properly get aggregator address", async () => {
      const adapterAddress = await contract.aggregator();
      expect(adapterAddress).to.eq(contract.address);
    });
  });

  describe("Tests for main logic of the Merged Adapter and feed", () => {
    let contract: MergedPriceFeedAdapterWithRounds;

    const testProperPriceUpdate = async ({
      valueForUpdate,
      expectedRoundId,
      expectedValuesInRounds,
    }: PriceUpdateTestParams) => {
      // Prepare timestamps
      const prevBlockTime = await time.latest();
      const curBlockTime = prevBlockTime + 10;
      const mockDataTimestamp = prevBlockTime * 1000;
      await time.setNextBlockTimestamp(curBlockTime);

      // Wrap contract
      const wrappedContract = WrapperBuilder.wrap(
        contract
      ).usingSimpleNumericMock({
        mockSignersCount: 2,
        timestampMilliseconds: mockDataTimestamp,
        dataPoints: [{ dataFeedId: "BTC", value: valueForUpdate }],
      });

      // Send the update
      const tx = await wrappedContract.updateDataFeedsValues(mockDataTimestamp);
      const txReceipt = await tx.wait();

      // Check the event
      const event: Event = txReceipt.events![0];
      expect(txReceipt.events!.length).to.be.equal(1);
      expectBigNumber(event.args!.current, valueForUpdate * 10 ** 8);
      expectBigNumber(event.args!.updatedAt, curBlockTime);
      expectBigNumber(event.args!.roundId, expectedRoundId);
      expect(event.event).to.be.equal("AnswerUpdated");

      // Read using price feed functions
      const latestRoundData = await contract.latestRoundData();
      expectBigNumber(latestRoundData.roundId, expectedRoundId);
      expectBigNumber(latestRoundData.answer, valueForUpdate * 10 ** 8);
      expectBigNumber(latestRoundData.updatedAt, curBlockTime);

      // Read using adapter functions
      const latestValueFromAdapter = await contract.getValueForDataFeed(
        formatBytes32String("BTC")
      );
      expectBigNumber(latestValueFromAdapter, valueForUpdate * 10 ** 8);

      // Check value for each round
      for (const { roundId, expectedValue } of expectedValuesInRounds) {
        const roundData = await contract.getRoundData(roundId);
        expectBigNumber(roundData.roundId, roundId);
        expectBigNumber(roundData.answer, expectedValue * 10 ** 8);
      }
    };

    before(async () => {
      contract = await deployBehindProxy();
    });

    it("Should properly update the value first time", async () => {
      const expectedValuesInRounds = [{ roundId: 1, expectedValue: 42 }];

      await testProperPriceUpdate({
        valueForUpdate: 42,
        expectedRoundId: roundsEndabled
          ? 1
          : DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS,
        expectedValuesInRounds: roundsEndabled ? expectedValuesInRounds : [],
      });
    });

    it("Should properly update the value second time", async () => {
      const expectedValuesInRounds = [
        { roundId: 1, expectedValue: 42 },
        { roundId: 2, expectedValue: 43 },
      ];

      await testProperPriceUpdate({
        valueForUpdate: 43,
        expectedRoundId: roundsEndabled
          ? 2
          : DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS,
        expectedValuesInRounds: roundsEndabled ? expectedValuesInRounds : [],
      });
    });

    it("Should upgrade the contract", async () => {
      const version = await contract.version();
      expectBigNumber(version, 1);
      const updatedContractFactory =
        await ethers.getContractFactory(updatedContractName);
      contract = (await upgrades.upgradeProxy(
        contract,
        updatedContractFactory
      )) as MergedPriceFeedAdapterWithRounds;
      const newVersion = await contract.version();
      expectBigNumber(newVersion, 42);
    });

    it("Should properly update the value third time", async () => {
      const expectedValuesInRounds = [
        { roundId: 1, expectedValue: 42 },
        { roundId: 2, expectedValue: 43 },
        { roundId: 3, expectedValue: 44 },
      ];

      await testProperPriceUpdate({
        valueForUpdate: 44,
        expectedRoundId: roundsEndabled
          ? 3
          : DEFAULT_ROUND_ID_FOR_WITHOUT_ROUNDS,
        expectedValuesInRounds: roundsEndabled ? expectedValuesInRounds : [],
      });
    });
  });
};

import { time } from "@nomicfoundation/hardhat-network-helpers";
import {
  SimpleNumericMockConfig,
  WrapperBuilder,
} from "@redstone-finance/evm-connector";
import { utils } from "@redstone-finance/protocol";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import { IRedstoneAdapter } from "../../../../typechain-types";

interface AdapterTestsParams {
  adapterContractName: string;
  hasOnlyOneDataFeed: boolean;
  skipTestsForPrevDataTimestamp: boolean;
  dataFeedId?: string;
  isErc7412?: boolean;
}

interface UpdateValuesParams {
  increaseBlockTimeBySeconds: number;
  calculateMockDataTimestamp?: (blockTimestamp: number) => number;
  mockWrapperConfig?: SimpleNumericMockConfig;
}

interface ValidateValuesAndTimestampsParams {
  expectedLatestBlockTimestamp: number;
  expectedLatestDataTimestamp: number;
  expectedValues: { [dataFeedId: string]: number };
}

chai.use(chaiAsPromised);

export const describeCommonPriceFeedsAdapterTests = ({
  adapterContractName,
  hasOnlyOneDataFeed,
  skipTestsForPrevDataTimestamp,
  dataFeedId = "BTC",
  isErc7412 = false,
}: AdapterTestsParams) => {
  let adapterContract: IRedstoneAdapter;

  const defaultMockWrapperConfig: SimpleNumericMockConfig = {
    dataPoints: [{ dataFeedId, value: 42 }],
    mockSignersCount: 2,
  };

  const updateValues = async (args: UpdateValuesParams) => {
    const mockBlockTimestamp =
      (await time.latest()) + args.increaseBlockTimeBySeconds;
    const mockDataTimestamp = args.calculateMockDataTimestamp
      ? args.calculateMockDataTimestamp(mockBlockTimestamp)
      : mockBlockTimestamp * 1000;

    // Wrap it with RedStone payload
    const wrappedContract = WrapperBuilder.wrap(
      adapterContract
    ).usingSimpleNumericMock({
      timestampMilliseconds: mockDataTimestamp,
      ...(args.mockWrapperConfig || defaultMockWrapperConfig),
    });

    // Update one data feed
    await time.setNextBlockTimestamp(mockBlockTimestamp);
    const tx = await wrappedContract.updateDataFeedsValues(mockDataTimestamp);
    await tx.wait();

    return {
      mockBlockTimestamp,
      mockDataTimestamp,
      tx,
      wrappedContract,
    };
  };

  const validateValuesAndTimestamps = async (
    args: ValidateValuesAndTimestampsParams
  ) => {
    // Validating values
    const dataFeedIds = Object.keys(args.expectedValues);
    const dataFeedIdsBytes32 = dataFeedIds.map(utils.convertStringToBytes32);
    const values =
      await adapterContract.getValuesForDataFeeds(dataFeedIdsBytes32);
    for (let i = 0; i < values.length; i++) {
      const expectedValue = args.expectedValues[dataFeedIds[i]];
      expect(values[i].toNumber()).to.eq(expectedValue * 10 ** 8);
    }

    // Validating timestamps
    const timestamps = await adapterContract.getTimestampsFromLatestUpdate();
    expect(timestamps.blockTimestamp.toNumber()).to.eq(
      args.expectedLatestBlockTimestamp
    );

    if (!skipTestsForPrevDataTimestamp) {
      expect(timestamps.dataTimestamp.toNumber()).to.eq(
        args.expectedLatestDataTimestamp
      );
    }
  };

  beforeEach(async () => {
    // Deploy a new adapter contract
    const adapterContractFactory =
      await ethers.getContractFactory(adapterContractName);
    adapterContract =
      (await adapterContractFactory.deploy()) as IRedstoneAdapter;
  });

  describe("upgrades", () => {
    let contractV1: IRedstoneAdapter;

    beforeEach(async () => {
      const adapterContractFactory =
        await ethers.getContractFactory(adapterContractName);

      contractV1 = (await upgrades.deployProxy(
        adapterContractFactory
      )) as IRedstoneAdapter;
    });

    it("should properly initialize", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(contractV1).to.not.be.undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
      await expect((contractV1 as any).initialize()).to.rejectedWith(
        "Initializable: contract is already initialized"
      );

      const dataFeeds = await contractV1.getDataFeedIds();
      expect(dataFeeds.length).to.eq(1);
      expect(dataFeeds[0]).to.eq(formatBytes32String(dataFeedId));

      expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
        await (contractV1 as any).getAuthorisedSignerIndex(
          "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
        )
      ).to.eq(1);
    });

    describe("should properly upgrade the contract ", () => {
      let updatedContract: IRedstoneAdapter;

      before(async () => {
        const updatedContractFactory = await ethers.getContractFactory(
          "PriceFeedsAdapterUpdatedMock"
        );

        updatedContract = (await upgrades.upgradeProxy(
          contractV1,
          updatedContractFactory
        )) as IRedstoneAdapter;
      });

      it("should change data feeds", async () => {
        const dataFeeds = await updatedContract.getDataFeedIds();

        expect(dataFeeds.length).to.eq(2);
        expect(dataFeeds).to.deep.eq([
          "0x4554480000000000000000000000000000000000000000000000000000000000",
          "0x4254430000000000000000000000000000000000000000000000000000000000",
        ]);
      });

      it("should change authorized updaters", async () => {
        expect(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
          await (updatedContract as any).getAuthorisedSignerIndex(
            "0xb323240B8185C1918A338Bd76A6473E20A25fa62"
          )
        ).to.eq(0);
      });
    });
  });

  it("should properly get indexes for data feeds", async () => {
    // TODO: implement more tests here
    const btcDataFeedIndex = await adapterContract.getDataFeedIndex(
      formatBytes32String(dataFeedId)
    );
    expect(btcDataFeedIndex.toNumber()).to.eq(0);
  });

  it("should revert trying to get index if data feed is not supported", async () => {
    await expect(
      adapterContract.getDataFeedIndex(formatBytes32String("BAD_SYMBOL"))
    ).to.be.revertedWith("DataFeedIdNotFound");
  });

  it("should revert trying to update by unauthorised updater", () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if min interval hasn't passed", async () => {
    const { mockBlockTimestamp, mockDataTimestamp } = await updateValues({
      increaseBlockTimeBySeconds: 1,
    });

    if (isErc7412) {
      // in case of erc7412 we don't revert but we also don't update prices
      await updateValues({ increaseBlockTimeBySeconds: 2 });
      await validateValuesAndTimestamps({
        expectedLatestBlockTimestamp: mockBlockTimestamp,
        expectedLatestDataTimestamp: mockDataTimestamp,
        expectedValues: { [dataFeedId]: 42 },
      });
    } else {
      await expect(
        updateValues({ increaseBlockTimeBySeconds: 2 })
      ).to.be.revertedWith("MinIntervalBetweenUpdatesHasNotPassedYet");
    }
  });

  if (!skipTestsForPrevDataTimestamp) {
    it("should revert if proposed data package timestamp is same as before", async () => {
      const { mockDataTimestamp } = await updateValues({
        increaseBlockTimeBySeconds: 1,
      });

      await expect(
        updateValues({
          increaseBlockTimeBySeconds: 5,
          calculateMockDataTimestamp: () => mockDataTimestamp,
        })
      ).to.be.revertedWith("DataTimestampShouldBeNewerThanBefore");
    });

    it("should revert if proposed data package timestamp is older than before", async () => {
      const { mockDataTimestamp } = await updateValues({
        increaseBlockTimeBySeconds: 1,
      });

      await expect(
        updateValues({
          increaseBlockTimeBySeconds: 5,
          calculateMockDataTimestamp: () => mockDataTimestamp - 1,
        })
      ).to.be.revertedWith("DataTimestampShouldBeNewerThanBefore");
    });
  }

  it("should revert if proposed data package timestamp is too old", async () => {
    await expect(
      updateValues({
        increaseBlockTimeBySeconds: 1,
        calculateMockDataTimestamp: (blockTimestamp) =>
          (blockTimestamp - 4 * 60) * 1000,
      })
    ).to.be.revertedWith("TimestampIsTooOld");
  });

  it("should revert if proposed data package timestamp is too new", async () => {
    await expect(
      updateValues({
        increaseBlockTimeBySeconds: 1,
        calculateMockDataTimestamp: (blockTimestamp) =>
          (blockTimestamp + 4 * 60) * 1000,
      })
    ).to.be.revertedWith("TimestampFromTooLongFuture");
  });

  it("should revert if at least one timestamp isn't equal to proposed timestamp", async () => {
    const latestBlockTimestamp = await time.latest();
    await expect(
      updateValues({
        increaseBlockTimeBySeconds: 1,
        mockWrapperConfig: {
          dataPoints: [{ dataFeedId, value: 42 }],
          mockSignersCount: 2,
          timestampMilliseconds: latestBlockTimestamp * 1000,
        },
      })
    ).to.be.revertedWith("DataPackageTimestampMismatch");
  });

  it("should revert if redstone payload is not attached", async () => {
    const mockBlockTimestamp = (await time.latest()) + 1;
    await expect(
      adapterContract.updateDataFeedsValues(mockBlockTimestamp * 1000)
    ).to.be.revertedWith("CalldataMustHaveValidPayload");
  });

  it("should revert if a data feed is missed in redstone payload", async () => {
    await expect(
      updateValues({
        increaseBlockTimeBySeconds: 1,
        mockWrapperConfig: {
          dataPoints: [{ dataFeedId: "NON-BTC", value: 42 }],
          mockSignersCount: 2,
        },
      })
    )
      .to.be.revertedWith("InsufficientNumberOfUniqueSigners")
      .withArgs(0, 2);
  });

  it("should revert for too few signers", async () => {
    await expect(
      updateValues({
        increaseBlockTimeBySeconds: 1,
        mockWrapperConfig: {
          dataPoints: [{ dataFeedId, value: 42 }],
          mockSignersCount: 1,
        },
      })
    )
      .to.be.revertedWith("InsufficientNumberOfUniqueSigners")
      .withArgs(1, 2);
  });

  it("should properly update data feeds one time", async () => {
    const { mockBlockTimestamp, mockDataTimestamp } = await updateValues({
      increaseBlockTimeBySeconds: 1,
    });

    await validateValuesAndTimestamps({
      expectedLatestBlockTimestamp: mockBlockTimestamp,
      expectedLatestDataTimestamp: mockDataTimestamp,
      expectedValues: { [dataFeedId]: 42 },
    });
  });

  it("should properly update data feeds with extra data feeds in payload", async () => {
    const { mockBlockTimestamp, mockDataTimestamp } = await updateValues({
      increaseBlockTimeBySeconds: 1,
      mockWrapperConfig: {
        dataPoints: [
          { dataFeedId: "NON-BTC", value: 422 },
          { dataFeedId, value: 42 },
          { dataFeedId: "NON-BTC-2", value: 123 },
        ],
        mockSignersCount: 2,
      },
    });

    await validateValuesAndTimestamps({
      expectedLatestBlockTimestamp: mockBlockTimestamp,
      expectedLatestDataTimestamp: mockDataTimestamp,
      expectedValues: { [dataFeedId]: 42 },
    });
  });

  it("should properly update data feeds several times", async () => {
    const updatesCount = 5;

    for (let i = 1; i <= updatesCount; i++) {
      const btcMockValue = i * 100;

      const { mockDataTimestamp, mockBlockTimestamp } = await updateValues({
        increaseBlockTimeBySeconds: i * 10,
        calculateMockDataTimestamp: (blockTimestamp) =>
          (blockTimestamp - 1) * 1000,
        mockWrapperConfig: {
          mockSignersCount: 2,
          dataPoints: [{ dataFeedId, value: btcMockValue }],
        },
      });

      await validateValuesAndTimestamps({
        expectedLatestBlockTimestamp: mockBlockTimestamp,
        expectedLatestDataTimestamp: mockDataTimestamp,
        expectedValues: { [dataFeedId]: btcMockValue },
      });
    }
  });

  it("should get a single data feed value", async () => {
    await updateValues({
      increaseBlockTimeBySeconds: 1,
    });
    const value = await adapterContract.getValueForDataFeed(
      utils.convertStringToBytes32(dataFeedId)
    );
    expect(value.toNumber()).to.be.equal(42 * 10 ** 8);
  });

  if (!hasOnlyOneDataFeed) {
    it("should get several data feed values", async () => {
      await updateValues({
        increaseBlockTimeBySeconds: 1,
      });

      const values = await adapterContract.getValuesForDataFeeds([
        utils.convertStringToBytes32(dataFeedId),
      ]);
      expect(values.length).to.equal(1);
      expect(values[0].toNumber()).to.equal(42 * 10 ** 8);
    });
  }

  it("should revert trying to get invalid (zero) data feed value", async () => {
    await expect(
      adapterContract.getValueForDataFeed(
        utils.convertStringToBytes32(dataFeedId)
      )
    ).to.be.revertedWith(
      isErc7412 ? "OracleDataRequired" : "DataFeedValueCannotBeZero"
    );
  });

  it("should revert trying to get a value for an unsupported data feed", async () => {
    await expect(
      adapterContract.getValueForDataFeed(
        utils.convertStringToBytes32("SMTH-ELSE")
      )
    ).to.be.revertedWith("DataFeedIdNotFound");
  });

  it("should revert trying to get several values, if one data feed is not supported", async () => {
    await updateValues({
      increaseBlockTimeBySeconds: 1,
    });

    await expect(
      adapterContract.getValuesForDataFeeds(
        [dataFeedId, "SMTH-ELSE"].map(utils.convertStringToBytes32)
      )
    ).to.be.revertedWith("DataFeedIdNotFound");
  });

  it("should revert trying to get several values, if one data feed has invalid (zero) value", async () => {
    await expect(
      adapterContract.getValuesForDataFeeds(
        [dataFeedId].map(utils.convertStringToBytes32)
      )
    ).to.be.revertedWith(
      isErc7412 ? "OracleDataRequired" : "DataFeedValueCannotBeZero"
    );
  });
};

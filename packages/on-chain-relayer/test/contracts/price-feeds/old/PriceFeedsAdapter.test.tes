import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Contract } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { PriceFeedsAdapterMock } from "../../../../typechain-types";
import {
  dataFeedsIds,
  getWrappedContractAndUpdateBlockTimestamp,
  btcDataFeed,
  ethDataFeed,
  mockEnvVariables,
} from "../../../helpers";

chai.use(chaiAsPromised);

describe("PriceFeedsAdapter", () => {
  let contract: PriceFeedsAdapterMock;
  let wrappedContract: Contract;
  let timestamp: number;
  let timestampSeconds: number;

  before(() => {
    mockEnvVariables();
  });

  beforeEach(async () => {
    await network.provider.send("hardhat_reset");
    const MangerContractFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterMock"
    );
    contract = await MangerContractFactory.deploy();
    await contract.deployed();
    timestamp = Date.now();
    timestampSeconds = Math.floor(timestamp / 1000);
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      timestamp
    );
    await wrappedContract.updateDataFeedsValues(timestamp);
  });

  it("should properly initialize", async () => {
    const [round, lastUpdateTimestamp] = await contract.getLatestRoundParams();
    expect(round).to.be.equal(1);
    expect(lastUpdateTimestamp).to.be.equal(timestampSeconds);
  });

  it("should revert if not enough time passed", async () => {
    const proposedTimestamp = timestamp + 1;
    await expect(
      wrappedContract.updateDataFeedsValues(proposedTimestamp)
    ).to.be.rejectedWith(
      `MinIntervalBetweenUpdatesHasNotPassedYet(10000, ${timestamp}, ${proposedTimestamp})`
    );
  });

  it("should revert if proposed timestamp smaller than last update", async () => {
    const smallerTimestamp = timestamp - 1000;
    await expect(
      wrappedContract.updateDataFeedsValues(smallerTimestamp)
    ).to.be.rejectedWith(
      `DataTimestampMustBeNewerThanLastDataTimestamp(${smallerTimestamp}, ${timestamp})`
    );
  });

  it("should revert if proposed timestamp is newer than in a data package", async () => {
    const newTimestamp = timestamp + 20_000;
    const biggerTimestamp = newTimestamp + 1;
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      newTimestamp
    );
    await expect(
      wrappedContract.updateDataFeedsValues(biggerTimestamp)
    ).to.be.rejectedWith(
      `DataPackageTimestampIsOlderThanProposedTimestamp(${biggerTimestamp}, ${newTimestamp})`
    );
  });

  it("should revert if invalid data feeds to update", async () => {
    const newTimestamp = timestamp + 20_000;
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      newTimestamp
    );
    const newDataFeedId = formatBytes32String("NewToken");
    await expect(
      wrappedContract.addDataFeedIdAndUpdateValues(newDataFeedId, newTimestamp)
    ).to.be.rejectedWith("InsufficientNumberOfUniqueSigners(0, 2)");
  });

  it("should update price feeds and get value for data feeds", async () => {
    const newTimestamp = timestamp + 20_000;
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      newTimestamp
    );
    await wrappedContract.updateDataFeedsValues(newTimestamp);
    const [round, lastUpdateTimestamp] = await contract.getLatestRoundParams();
    expect(round).to.be.equal(2);
    expect(lastUpdateTimestamp).to.be.equal(Math.floor(newTimestamp / 1000));
    const dataFeedsValues = await contract.getValuesForDataFeeds(dataFeedsIds);
    expect(dataFeedsValues[0]).to.be.equal(167099000000);
    expect(dataFeedsValues[1]).to.be.equal(2307768000000);
    const dataFeedValueAndRoundParams =
      await contract.getRoundData(btcDataFeed, round);
    expect(dataFeedValueAndRoundParams.dataFeedValue).to.be.equal(
      2307768000000
    );
    expect(
      dataFeedValueAndRoundParams.roundDataTimestamp
    ).to.be.equal(Math.floor(newTimestamp / 1000));
  });

  it("should add new data feed", async () => {
    const newTimestamp = timestamp + 20_000;
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      newTimestamp,
      {
        dataFeedId: "NewToken",
        value: 2,
      }
    );
    const newDataFeedId = formatBytes32String("NewToken");
    await wrappedContract.addDataFeedIdAndUpdateValues(
      newDataFeedId,
      newTimestamp
    );
    const dataFeeds = await contract.getDataFeedIds();
    expect(dataFeeds.length).to.be.equal(3);
    expect(dataFeeds[2]).to.be.equal(newDataFeedId);
  });

  it("should not add new data feed if already exists", async () => {
    const newTimestamp = timestamp + 20_000;
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      newTimestamp
    );
    await wrappedContract.addDataFeedIdAndUpdateValues(
      ethDataFeed,
      newTimestamp
    );
    const dataFeeds = await contract.getDataFeedIds();
    expect(dataFeeds.length).to.be.equal(2);
  });
});

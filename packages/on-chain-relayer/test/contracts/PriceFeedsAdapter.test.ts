import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Contract } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { PriceFeedsAdapterMock } from "../../typechain-types";
import {
  dataFeedsIds,
  getWrappedContractAndUpdateBlockTimestamp,
  btcDataFeed,
  ethDataFeed,
  mockEnvVariables,
} from "../helpers";

chai.use(chaiAsPromised);

describe("PriceFeedsAdapter", () => {
  let contract: PriceFeedsAdapterMock;
  let wrappedContract: Contract;
  let timestamp: number;

  before(() => {
    mockEnvVariables();
  });

  beforeEach(async () => {
    await network.provider.send("hardhat_reset");
    const MangerContractFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterMock"
    );
    contract = await MangerContractFactory.deploy(dataFeedsIds);
    await contract.deployed();
    timestamp = Date.now();
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      timestamp
    );
    await wrappedContract.updateDataFeedsValues(1, timestamp);
  });

  it("should properly initialize", async () => {
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(1);
    expect(lastUpdateTimestamp).to.be.equal(timestamp);
  });

  it("should return if invalid proposed round", async () => {
    await wrappedContract.updateDataFeedsValues(0, timestamp);
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(1);
    expect(lastUpdateTimestamp).to.be.equal(timestamp);
  });

  it("should revert if proposed timestamp smaller than last update", async () => {
    const smallerTimestamp = timestamp - 1000;
    await expect(
      wrappedContract.updateDataFeedsValues(2, smallerTimestamp)
    ).to.be.rejectedWith(
      `ProposedTimestampSmallerOrEqualToLastTimestamp(${smallerTimestamp}, ${timestamp})`
    );
  });

  it("should revert if proposed timestamp is newer than received", async () => {
    const newTimestamp = timestamp + 1000;
    const biggerTimestamp = timestamp + 1050;
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      newTimestamp
    );
    await expect(
      wrappedContract.updateDataFeedsValues(2, biggerTimestamp)
    ).to.be.rejectedWith(
      `ProposedTimestampDoesNotMatchReceivedTimestamp(${biggerTimestamp}, ${newTimestamp})`
    );
  });

  it("should revert if invalid data feeds to update", async () => {
    const newTimestamp = timestamp + 1000;
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
    const newTimestamp = timestamp + 1000;
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      newTimestamp
    );
    await wrappedContract.updateDataFeedsValues(2, newTimestamp);
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(2);
    expect(lastUpdateTimestamp).to.be.equal(newTimestamp);
    const dataFeedsValues = await contract.getValuesForDataFeeds(dataFeedsIds);
    expect(dataFeedsValues[0]).to.be.equal(167099000000);
    expect(dataFeedsValues[1]).to.be.equal(2307768000000);
    const dataFeedValueAndRoundParams =
      await contract.getValueForDataFeedAndLastRoundParams(btcDataFeed);
    expect(dataFeedValueAndRoundParams.dataFeedValue).to.be.equal(
      2307768000000
    );
    expect(dataFeedValueAndRoundParams.lastRoundNumber).to.be.equal(2);
    expect(
      dataFeedValueAndRoundParams.lastUpdateTimestampInMilliseconds
    ).to.be.equal(newTimestamp);
  });

  it("should add new data feed", async () => {
    const newTimestamp = timestamp + 1000;
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
    const dataFeeds = await contract.getDataFeedsIds();
    expect(dataFeeds.length).to.be.equal(3);
    expect(dataFeeds[2]).to.be.equal(newDataFeedId);
  });

  it("should not add new data feed if already exists", async () => {
    const newTimestamp = timestamp + 1000;
    wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      contract,
      newTimestamp
    );
    await wrappedContract.addDataFeedIdAndUpdateValues(
      ethDataFeed,
      newTimestamp
    );
    const dataFeeds = await contract.getDataFeedsIds();
    expect(dataFeeds.length).to.be.equal(2);
  });
});

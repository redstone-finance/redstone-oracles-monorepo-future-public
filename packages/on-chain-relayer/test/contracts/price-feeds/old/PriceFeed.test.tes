import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { PriceFeedWithRounds, PriceFeedsAdapterWithRounds } from "../../../../typechain-types";
import {
  dataFeedsIds,
  ethDataFeed,
  getWrappedContractAndUpdateBlockTimestamp,
  mockEnvVariables,
} from "../../../helpers";

chai.use(chaiAsPromised);

describe("PriceFeed", () => {
  let contract: PriceFeedWithRounds;
  let adapterContract: PriceFeedsAdapterWithRounds;

  before(() => {
    mockEnvVariables();
  });

  beforeEach(async () => {
    const AdapterContractFactory = await ethers.getContractFactory(
      "PriceFeedsAdapterMock"
    );
    adapterContract = await AdapterContractFactory.deploy(dataFeedsIds);
    await adapterContract.deployed();

    const ContractFactory = await ethers.getContractFactory("PriceFeedWithRounds");
    contract = await ContractFactory.deploy(
      adapterContract.address,
      ethDataFeed,
      "RedStone price feed for TestToken"
    );

    await contract.deployed();

    const timestamp = Date.now();
    const wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
      adapterContract,
      timestamp
    );
    await wrappedContract.updateDataFeedsValues(timestamp);
  });

  it("should properly initialize", async () => {
    const dataFeedId = await contract.dataFeedId();
    expect(dataFeedId).to.be.equal(ethDataFeed);
    const description = await contract.description();
    expect(description).to.be.equal("RedStone price feed for TestToken");
  });

  it("should revert for non-existent round", async () => {
    const errCode = "0xf8ae8137";
    await expect(contract.getRoundData(0)).to.be.rejectedWith(errCode);
    await expect(contract.getRoundData(42)).to.be.rejectedWith(errCode);
  });

  it("should store data feed value and fetch latest value", async () => {
    const latestRoundData = await contract.latestRoundData();
    expect(latestRoundData.answer).to.be.equal(167099000000);
    expect(latestRoundData.roundId).to.be.equal(1);
  });

  it("should store few times and get data for each round", async () => {
    const roundsCount = 3;
    let timestamp = Date.now();

    // We already have round 1, so we start from 2
    for (let roundId = 2; roundId <= roundsCount; roundId++) {
      timestamp += 20_000; // we need to increase it enough to reach the min interval between updates
      const wrappedContract = await getWrappedContractAndUpdateBlockTimestamp(
        adapterContract,
        timestamp
      );
      await wrappedContract.updateDataFeedsValues(timestamp);
    }

    for (let roundId = 1; roundId <= roundsCount; roundId++) {
      const roundTimestampMilliseconds = timestamp - 20_000 * (roundsCount - roundId);
      const expectedTimestamp = Math.floor(roundTimestampMilliseconds / 1000);
      const roundData = await contract.getRoundData(roundId);
      expect(roundData.answer).to.be.equal(167099000000);
      expect(roundData.roundId).to.be.equal(roundId);
      expect(roundData.updatedAt).to.be.equal(expectedTimestamp);
    }
  });
});

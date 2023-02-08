import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Contract } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import {
  PriceFeedsManagerMock,
  PriceFeedsRegistry,
} from "../../typechain-types";
import { addDataFeedsToRegistry, getWrappedContract } from "./helpers";

chai.use(chaiAsPromised);

describe("PriceFeedsManager", () => {
  let contract: PriceFeedsManagerMock;
  let registryContract: PriceFeedsRegistry;
  let wrappedContract: Contract;
  let timestamp: number;

  before(async () => {
    await network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    const RegistryContractFactory = await ethers.getContractFactory(
      "PriceFeedsRegistry"
    );
    const MangerContractFactory = await ethers.getContractFactory(
      "PriceFeedsManagerMock"
    );
    contract = await MangerContractFactory.deploy();
    await contract.deployed();
    registryContract = await RegistryContractFactory.deploy(contract.address);
    await registryContract.deployed();
    await contract.initialize(registryContract.address);
    await addDataFeedsToRegistry(registryContract);
    timestamp = Date.now();
    wrappedContract = getWrappedContract(contract, timestamp);
    await wrappedContract.updateDataFeedValues(1, timestamp);
  });

  it("should properly initialize", async () => {
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(1);
    expect(lastUpdateTimestamp).to.be.equal(timestamp);
  });

  it("should return if invalid proposed round", async () => {
    await wrappedContract.updateDataFeedValues(0, timestamp);
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(1);
    expect(lastUpdateTimestamp).to.be.equal(timestamp);
  });

  it("should revert if proposed timestamp smaller than last update", async () => {
    const smallerTimestamp = timestamp - 1000;
    await expect(
      wrappedContract.updateDataFeedValues(2, smallerTimestamp)
    ).to.be.rejectedWith(
      `ProposedTimestampSmallerOrEqualToLastTimestamp(${smallerTimestamp}, ${timestamp})`
    );
  });

  it("should revert if proposed timestamp is not the same as received", async () => {
    const newTimestamp = timestamp + 1000;
    const timestampNotEqualToReceived = timestamp + 1050;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    await expect(
      wrappedContract.updateDataFeedValues(2, timestampNotEqualToReceived)
    ).to.be.rejectedWith(
      `ProposedTimestampDoesNotMatchReceivedTimestamp(${timestampNotEqualToReceived}, ${newTimestamp})`
    );
  });

  it("should update data feeds prices", async () => {
    const newTimestamp = timestamp + 1000;
    wrappedContract = getWrappedContract(contract, newTimestamp);
    await wrappedContract.updateDataFeedValues(2, newTimestamp);
    const [round, lastUpdateTimestamp] = await contract.getLastRoundParams();
    expect(round).to.be.equal(2);
    expect(lastUpdateTimestamp).to.be.equal(newTimestamp);
    const ethPriceFeedAddress =
      await registryContract.getPriceFeedContractAddress(
        formatBytes32String("ETH")
      );
    const ethPriceFeedContract = await ethers.getContractAt(
      "PriceFeed",
      ethPriceFeedAddress
    );
    const ethRoundData = await ethPriceFeedContract.latestRoundData();
    expect(ethRoundData.answer).to.be.equal(167099000000);
    const btcPriceFeedAddress =
      await registryContract.getPriceFeedContractAddress(
        formatBytes32String("BTC")
      );
    const btcPriceFeedContract = await ethers.getContractAt(
      "PriceFeed",
      btcPriceFeedAddress
    );
    const btcRoundData = await btcPriceFeedContract.latestRoundData();
    expect(btcRoundData.answer).to.be.equal(2307768000000);
  });
});

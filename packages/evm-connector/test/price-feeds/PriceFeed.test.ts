import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { PriceFeed } from "../../typechain-types";

chai.use(chaiAsPromised);

describe("PriceFeed", () => {
  let contract: PriceFeed;
  let contractWithNotOwner: PriceFeed;
  const dataFeedIdAsBytes32 = ethers.utils.formatBytes32String("TestToken");

  beforeEach(async () => {
    const [owner, notOwner] = await ethers.getSigners();
    const ownerAddress = await owner.getAddress();
    const ContractFactory = await ethers.getContractFactory("PriceFeed");
    contract = await ContractFactory.deploy(
      ownerAddress,
      dataFeedIdAsBytes32,
      "RedStone price feed for TestToken"
    );
    contractWithNotOwner = contract.connect(notOwner);

    await contract.deployed();
  });

  it("should properly initialize", async () => {
    const dataFeedId = await contract.getDataFeedId();
    expect(dataFeedId).to.be.equal(dataFeedIdAsBytes32);
    const description = await contract.description();
    expect(description).to.be.equal("RedStone price feed for TestToken");
  });

  it("should revert if calling getRoundData", async () => {
    await expect(contract.getRoundData(0)).to.be.rejectedWith(
      "Use latestRoundData to get data feed price"
    );
  });

  it("should revert if not owner tries to store data feed value", async () => {
    await expect(
      contractWithNotOwner.storeDataFeedValue(123)
    ).to.be.rejectedWith("Caller is not the owner");
  });

  it("should store data feed value and fetch latest value", async () => {
    await contract.storeDataFeedValue(123);
    const latestValue = await contract.latestRoundData();
    expect(latestValue.answer).to.be.equal(123);
  });

  it("should store data feed value twice and fetch latest value", async () => {
    await contract.storeDataFeedValue(125);
    await contract.storeDataFeedValue(128);
    const latestValue = await contract.latestRoundData();
    expect(latestValue.answer).to.be.equal(128);
  });
});

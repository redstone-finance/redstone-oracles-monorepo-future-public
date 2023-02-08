import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { PriceFeedsRegistry } from "../../typechain-types";

chai.use(chaiAsPromised);

describe("PriceFeedsRegistry", () => {
  let contract: PriceFeedsRegistry;
  let contractWithNotOwner: PriceFeedsRegistry;

  beforeEach(async () => {
    const [owner, notOwner] = await ethers.getSigners();
    const ContractFactory = await ethers.getContractFactory(
      "PriceFeedsRegistry"
    );
    const address = await owner.getAddress();
    contract = await ContractFactory.deploy(address);
    contractWithNotOwner = contract.connect(notOwner);

    await contract.deployed();
  });

  it("should properly initialize", async () => {
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(0);
  });

  it("should revert if not owner tries to add data feed", async () => {
    const dataFeedId = formatBytes32String("TestToken");
    await expect(
      contractWithNotOwner.addDataFeed(dataFeedId)
    ).to.be.rejectedWith("Ownable: caller is not the owner");
  });

  it("should revert if not owner tries to remove data feed", async () => {
    const dataFeedId = formatBytes32String("AVAX");
    await expect(
      contractWithNotOwner.addDataFeed(dataFeedId)
    ).to.be.rejectedWith("Ownable: caller is not the owner");
  });

  it("should return price feed address for data feed", async () => {
    const dataFeedIdToAdd = formatBytes32String("ETH");
    await contract.addDataFeed(dataFeedIdToAdd);
    const priceFeedAddress = await contract.getPriceFeedContractAddress(
      dataFeedIdToAdd
    );
    expect(priceFeedAddress).to.be.string;
  });

  it("should add multiple new price feeds", async () => {
    const firstNewDataFeedId = formatBytes32String("AVAX");
    const secondNewDataFeedId = formatBytes32String("BTC");
    await contract.addDataFeed(firstNewDataFeedId);
    await contract.addDataFeed(secondNewDataFeedId);
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(2);
    const newFirstDataFeed = parseBytes32String(dataFeeds[0]);
    const newSecondDataFeed = parseBytes32String(dataFeeds[1]);
    expect(newFirstDataFeed).to.be.equal("AVAX");
    expect(newSecondDataFeed).to.be.equal("BTC");
  });

  it("shouldn't add price feed if exists", async () => {
    const dataFeedIdToAdd = formatBytes32String("USDC");
    await contract.addDataFeed(dataFeedIdToAdd);
    await contract.addDataFeed(dataFeedIdToAdd);
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(1);
  });

  it("should remove multiple new price feeds", async () => {
    const firstDataFeedIdToDelete = formatBytes32String("USDT");
    const secondDataFeedIdToDelete = formatBytes32String("JOE");
    await contract.addDataFeed(firstDataFeedIdToDelete);
    await contract.addDataFeed(secondDataFeedIdToDelete);
    await contract.removeDataFeed(firstDataFeedIdToDelete);
    await contract.removeDataFeed(secondDataFeedIdToDelete);
    const dataFeeds = await contract.getDataFeeds();
    expect(dataFeeds.length).to.be.equal(0);
    await expect(
      contract.getPriceFeedContractAddress(secondDataFeedIdToDelete)
    ).to.be.rejectedWith("EnumerableMap: nonexistent key");
  });
});

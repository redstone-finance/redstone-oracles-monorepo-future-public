import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleRedstoneConsumerNumericMockManyDataFeeds } from "../../typechain-types";

// TODO: implement

// TODO: mock redstone-sdk function here

describe("DataServiceWrapper: bytes", function () {
  let contract: SampleRedstoneConsumerNumericMockManyDataFeeds;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMockManyDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction with bytes values", async () => {
    expect(2 + 2).to.eq(4);
  });
});

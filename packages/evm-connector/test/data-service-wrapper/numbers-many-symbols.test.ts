import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleRedstoneConsumerMockManySymbols } from "../../typechain-types";

// TODO: implement

// TODO: mock redstone-sdk function here

describe("DataServiceWrapper: numbers with many dataFeedIds", function () {
  let contract: SampleRedstoneConsumerMockManySymbols;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerMockManySymbols"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction with oracle values", async () => {
    expect(2 + 2).to.eq(4);
  });
});

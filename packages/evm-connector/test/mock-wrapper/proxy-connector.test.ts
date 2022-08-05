import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleRedstoneConsumerMockManySymbols } from "../../typechain-types";

// TODO: implement

describe("SampleProxyConnector", function () {
  let contract: SampleRedstoneConsumerMockManySymbols;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerMockManySymbols"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should return correct oracle value for one asset", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should return correct oracle values for 10 assets in correct order", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should forward msg.value", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should work properly with long encoded functions", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should fail with correct message (timestamp invalid)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should fail with correct message (insufficient number of unique signers)", async () => {
    expect(2 + 2).to.eq(4);
  });
});

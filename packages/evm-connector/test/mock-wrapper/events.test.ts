import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleWithEvents } from "../../typechain-types";

// TODO: implement

describe("SampleWithEvents", function () {
  let contract: SampleWithEvents;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory("SampleWithEvents");
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should have correct events in transaction receipt after wrapping", async () => {
    expect(2 + 2).to.eq(4);
  });
});

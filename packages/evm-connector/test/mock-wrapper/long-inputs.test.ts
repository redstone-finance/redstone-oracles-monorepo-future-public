import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleRedstoneConsumerBytesMock } from "../../typechain-types";

// TODO: implement

describe("Long Inputs", function () {
  let contract: SampleRedstoneConsumerBytesMock;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should get oracle value (1K bytes)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should get oracle value (100K bytes)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should get oracle value (1000K bytes)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should get oracle value (10M bytes)", async () => {
    expect(2 + 2).to.eq(4);
  });
});

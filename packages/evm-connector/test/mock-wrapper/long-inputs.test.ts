import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleRedstoneConsumerBytesMock } from "../../typechain-types";

// TODO: implement

// TODO: test cases close to and with overflow for:
// - data packages count
// - data points count
// - unsigned metadata bytes size

describe("Long Inputs", function () {
  let contract: SampleRedstoneConsumerBytesMock;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should get oracle value (1K bytes value)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should get oracle value (100K bytes value)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should get oracle value (1000K bytes value)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should get oracle value (10M bytes value)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should get oracle value (100k data pacakages)", async () => {
    expect(2 + 2).to.eq(4);
  });
});

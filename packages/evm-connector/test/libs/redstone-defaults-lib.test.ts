import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SampleRedstoneDefaultsLib } from "../../typechain-types";
import { getBlockTimestampMilliseconds } from "../tests-common";

const MILLISECONDS_IN_MINUTE = 60 * 1000;

describe("SampleRedstoneDefaultsLib", function () {
  let contract: SampleRedstoneDefaultsLib;

  beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneDefaultsLib"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly validate valid timestamps", async () => {
    const timestamp = await getBlockTimestampMilliseconds();
    await contract.validateTimestamp(timestamp);
    await contract.validateTimestamp(timestamp + 0.5 * MILLISECONDS_IN_MINUTE);
    await contract.validateTimestamp(timestamp - 2.5 * MILLISECONDS_IN_MINUTE);
  });

  it("Should revert for too old timestamp", async () => {
    const timestamp = await getBlockTimestampMilliseconds();
    await expect(
      contract.validateTimestamp(timestamp - 4 * MILLISECONDS_IN_MINUTE)
    ).to.be.revertedWith("TimestampIsTooOld");
  });

  it("Should revert for timestamp from too long future", async () => {
    const timestamp = await getBlockTimestampMilliseconds();
    await expect(
      contract.validateTimestamp(timestamp + 2 * MILLISECONDS_IN_MINUTE)
    ).to.be.revertedWith("TimestampFromTooLongFuture");
  });

  it("Should properly aggregate an array with 1 value", async () => {
    const aggregatedValue = await contract.aggregateValues([42]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should properly aggregate an array with 3 values", async () => {
    const aggregatedValue = await contract.aggregateValues([41, 43, 42]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should properly aggregate an array with 4 values", async () => {
    const aggregatedValue = await contract.aggregateValues([38, 44, 40, 100]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should properly aggregate an array with values, which include a very big number", async () => {
    const aggregatedValue = await contract.aggregateValues([
      44,
      BigNumber.from("1000000000000000000000000000000000000"),
      40,
      10,
    ]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should properly aggregate an array with values, which include zeros", async () => {
    const aggregatedValue = await contract.aggregateValues([
      44, 0, 68, 0, 100, 0, 42,
    ]);
    expect(aggregatedValue.toNumber()).to.eql(42);
  });

  it("Should revert trying to aggregate an empty array", async () => {
    await expect(contract.aggregateValues([])).to.be.revertedWith(
      "CanNotPickMedianOfEmptyArray"
    );
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";
import { SampleDeviationLib } from "../../../typechain-types";

describe("DeviationLib", function () {
  let deviationLib: SampleDeviationLib;

  before(async function () {
    const deviationLibFactory =
      await ethers.getContractFactory("SampleDeviationLib");
    deviationLib = await deviationLibFactory.deploy();
    await deviationLib.deployed();
  });

  it("return 0 if precision is 0", async function () {
    const proposedValue = 120;
    const originalValue = 100;
    const precision = 0;
    const expectedDeviation = 0;

    const deviation = await deviationLib.calculateAbsDeviation(
      proposedValue,
      originalValue,
      precision
    );

    expect(deviation).to.equal(expectedDeviation);
  });

  it("should fail if original value is zero", async function () {
    const proposedValue = 120;
    const originalValue = 0;
    const precision = 1000;

    await expect(
      deviationLib.calculateAbsDeviation(
        proposedValue,
        originalValue,
        precision
      )
    ).to.be.revertedWith("Panic");
  });

  it("calculates deviation with new value bigger", async function () {
    const proposedValue = 120;
    const originalValue = 100;
    const precision = 1;
    const expectedDeviation = 20;

    const deviation = await deviationLib.calculateAbsDeviation(
      proposedValue,
      originalValue,
      precision
    );

    expect(deviation).to.equal(expectedDeviation);
  });

  it("calculates deviation with new value smaller", async function () {
    const proposedValue = 100;
    const originalValue = 110;
    const precision = 1;
    const expectedDeviation = 9;

    const deviation = await deviationLib.calculateAbsDeviation(
      proposedValue,
      originalValue,
      precision
    );

    expect(deviation).to.equal(expectedDeviation);
  });

  it("calculates deviation with new less round values", async function () {
    const proposedValue = 11;
    const originalValue = 3;
    const precision = 1;
    const expectedDeviation = 266;

    const deviation = await deviationLib.calculateAbsDeviation(
      proposedValue,
      originalValue,
      precision
    );

    expect(deviation).to.equal(expectedDeviation);
  });

  it("calculates deviation with bigger precision", async function () {
    const proposedValue = 9432;
    const originalValue = 9123;
    const precision = 1000;
    const expectedDeviation = 3387;

    const deviation = await deviationLib.calculateAbsDeviation(
      proposedValue,
      originalValue,
      precision
    );

    expect(deviation).to.equal(expectedDeviation);
  });

  it("calculates deviation with small number and big precision", async function () {
    const proposedValue = 1;
    const originalValue = 3;
    const precision = 100000000;
    const expectedDeviation = 6666666666;

    const deviation = await deviationLib.calculateAbsDeviation(
      proposedValue,
      originalValue,
      precision
    );

    expect(deviation).to.equal(expectedDeviation);
  });

  it("calculates deviation with big number and big precision", async function () {
    const proposedValue = "1035595305017573100";
    const originalValue = "1077019117218276000";
    const precision = 100000000;
    const expectedDeviation = 384615384;

    const deviation = await deviationLib.calculateAbsDeviation(
      proposedValue,
      originalValue,
      precision
    );

    expect(deviation).to.equal(expectedDeviation);
  });

  it("calculates deviation with distinct numbers and big precision", async function () {
    const proposedValue = "3";
    const originalValue = "1077019117218276000";
    const precision = 100000000;
    const expectedDeviation = 9999999999;

    const deviation = await deviationLib.calculateAbsDeviation(
      proposedValue,
      originalValue,
      precision
    );

    expect(deviation).to.equal(expectedDeviation);
  });
});

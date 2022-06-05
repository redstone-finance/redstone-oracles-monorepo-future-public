import { ethers } from "hardhat";
import { SampleNumericArrayLib } from "../typechain-types";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("SampleNumericArrayLib", function () {
  let contract: SampleNumericArrayLib;

  const testArr = [3, 1, 4, 5, 2, 9, 8, 7, 4];
  const sortedTestArr = [...testArr].sort();

  beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleNumericArrayLib"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should store array in storage", async () => {
    const tx = await contract.testArrayUpdatingInStorage([
      3, 1, 4, 5, 2, 9, 8, 7, 4,
    ]);
    await tx.wait();
  });

  it("Should correctly sort values", async () => {
    const tx = await contract.testSortTx([3, 1, 4, 5, 2, 9, 8, 7, 4]);
    await tx.wait();

    const cachedArray = await contract.getCachedArray();
    expect(cachedArray.map((bn: BigNumber) => bn.toNumber())).to.eql(
      sortedTestArr
    );
  });

  it("Should correctly pick the median value in an array with an odd length", async () => {
    const tx = await contract.testMedianSelection([3, 2, 5, 4, 1]);
    await tx.wait();
    const selectedMedian = await contract.cachedMedian();
    expect(selectedMedian.toNumber()).to.eq(3);
  });

  it("Should correctly pick the median value in an array with an even length", async () => {
    const tx = await contract.testMedianSelection([300, 200, 500, 400]);
    await tx.wait();
    const selectedMedian = await contract.cachedMedian();
    expect(selectedMedian.toNumber()).to.eq(350);
  });

  it("Should store array in storage", async () => {
    const tx = await contract.testArrayUpdatingInStorage([
      3, 1, 4, 5, 2, 9, 8, 7, 4,
    ]);
    await tx.wait();
  });

  it("Should store array in storage", async () => {
    const tx = await contract.testArrayUpdatingInStorage([
      3, 1, 4, 5, 2, 9, 8, 7, 4,
    ]);
    await tx.wait();
  });
});

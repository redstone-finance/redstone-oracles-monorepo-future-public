import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SampleBitmapLib } from "../../typechain-types";

describe("SampleBitmapLib", function () {
  let contract: SampleBitmapLib,
    expectedBitmap: any = {},
    bitmapNumber = BigNumber.from(0);

  const setBit = async (bitIndex: number) => {
    expectedBitmap[bitIndex] = 1;
    bitmapNumber = await contract.setBitInBitmap(bitmapNumber, bitIndex);
  };

  const validateBitmap = async () => {
    for (let bitIndex = 0; bitIndex < 256; bitIndex++) {
      const expectedBit = !!expectedBitmap[bitIndex];
      const receivedBit = await contract.getBitFromBitmap(
        bitmapNumber,
        bitIndex
      );
      const customErrMsg = "Bitmap invalid: " + JSON.stringify({ bitIndex });
      expect(receivedBit).to.eq(expectedBit, customErrMsg);
    }
  };

  this.beforeAll(async () => {
    const ContractFactory = await ethers.getContractFactory("SampleBitmapLib");
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Bitmap should be empty in the beginning", async () => {
    validateBitmap();
  });

  for (const bitIndexToSet of [0, 1, 42, 235, 255]) {
    it("Should correctly set bit: " + bitIndexToSet, async () => {
      await setBit(bitIndexToSet);
      await validateBitmap();
    });
  }
});

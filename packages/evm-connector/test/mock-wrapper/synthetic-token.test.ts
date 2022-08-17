import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src/index";
import { SampleSyntheticToken } from "../../typechain-types";
import { expect } from "chai";
import { Signer } from "ethers";
import { NUMBER_OF_MOCK_NUMERIC_SIGNERS } from "../tests-common";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import {
  getMockNumericPackage,
  getRange,
  MockSignerIndex,
} from "../../src/helpers/test-utils";

// TODO audit: measure how many bytes do we add to the consumer contracts

describe("SampleSyntheticToken", function () {
  let sampleContract: SampleSyntheticToken,
    wrappedContract: any,
    signer: Signer,
    address: string;

  const toEth = function (val: number) {
    return ethers.utils.parseEther(val.toString());
  };
  const toVal = function (val: number) {
    return ethers.utils.parseUnits(val.toString(), 26);
  };

  beforeEach(async () => {
    const SampleSyntheticToken = await ethers.getContractFactory(
      "SampleSyntheticToken"
    );
    sampleContract = await SampleSyntheticToken.deploy();
    await sampleContract.initialize(
      convertStringToBytes32("REDSTONE"),
      "SYNTH-REDSTONE",
      "SREDSTONE"
    );
    await sampleContract.deployed();
    [signer] = await ethers.getSigners();
    address = await signer.getAddress();

    const mockDataPackages = getRange({
      start: 0,
      length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
    }).map((i) =>
      getMockNumericPackage({
        dataPoints: [
          {
            dataFeedId: "ETH",
            value: 2000,
          },
          {
            dataFeedId: "REDSTONE",
            value: 200,
          },
        ],
        mockSignerIndex: i as MockSignerIndex,
      })
    );

    wrappedContract =
      WrapperBuilder.wrap(sampleContract).usingMockData(mockDataPackages);
  });

  it("Maker balance should be 0", async () => {
    expect(await wrappedContract.balanceOf(address)).to.equal(0);
  });

  it("Should mint", async () => {
    const tx = await wrappedContract.mint(toEth(100), { value: toEth(20) });
    await tx.wait();

    expect(await wrappedContract.balanceOf(address)).to.equal(toEth(100));
    expect(await wrappedContract.balanceValueOf(address)).to.equal(
      toVal(20000)
    );
    expect(await wrappedContract.totalValue()).to.equal(toVal(20000));
    expect(await wrappedContract.collateralOf(address)).to.equal(toEth(20));
    expect(await wrappedContract.collateralValueOf(address)).to.equal(
      toVal(40000)
    );
    expect(await wrappedContract.debtOf(address)).to.equal(toEth(100));
    expect(await wrappedContract.debtValueOf(address)).to.equal(toVal(20000));
    expect(await wrappedContract.solvencyOf(address)).to.equal(2000);
  });
});

import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleRedstoneConsumerBytesMockStrings } from "../../typechain-types";
import {
  DEFAULT_DATA_FEED_ID_BYTES_32,
  getMockPackageWithOneBytesDataPoint,
  getRange,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src";

describe("Long Inputs", function () {
  let contract: SampleRedstoneConsumerBytesMockStrings;

  const prepareMockBytesPackages = (hexValue: string) => {
    return getRange({
      start: 0,
      length: 3,
    }).map((mockSignerIndex: any) =>
      getMockPackageWithOneBytesDataPoint({
        mockSignerIndex,
        hexValue,
      })
    );
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMockStrings"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should pass long bytes oracle value", async () => {
    const hexValue = "0x" + "f".repeat(30_000);
    const mockPackages = prepareMockBytesPackages(hexValue);
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);
    await wrappedContract.saveLatestValueInStorage(
      DEFAULT_DATA_FEED_ID_BYTES_32
    );
    expect(await contract.latestString()).to.be.equal(hexValue);
  });
});

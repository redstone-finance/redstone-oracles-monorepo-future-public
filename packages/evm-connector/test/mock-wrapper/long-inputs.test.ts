import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src";
import {
  DEFAULT_DATA_FEED_ID_BYTES_32,
  getMockPackageWithOneBytesDataPoint,
  getRange,
  MockSignerIndex,
} from "../../src/helpers/test-utils";
import { SampleRedstoneConsumerBytesMockStrings } from "../../typechain-types";

describe("Long Inputs", function () {
  let contract: SampleRedstoneConsumerBytesMockStrings;

  const prepareMockBytesPackages = (hexValue: string) => {
    return getRange({
      start: 0,
      length: 3,
    }).map((mockSignerIndex) =>
      getMockPackageWithOneBytesDataPoint({
        mockSignerIndex: mockSignerIndex as MockSignerIndex,
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
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockPackages);
    await wrappedContract.saveLatestValueInStorage(
      DEFAULT_DATA_FEED_ID_BYTES_32
    );
    expect(await contract.latestString()).to.be.equal(hexValue);
  });
});

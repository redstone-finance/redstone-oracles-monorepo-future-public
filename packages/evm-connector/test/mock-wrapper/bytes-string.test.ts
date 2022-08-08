import { expect } from "chai";
import { ethers } from "hardhat";
import {
  getMockPackageWithOneBytesDataPoint,
  getRange,
  DEFAULT_DATA_FEED_ID_BYTES_32,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerBytesMockStrings } from "../../typechain-types";

describe("SampleRedstoneConsumerBytesMockStrings", function () {
  let contract: SampleRedstoneConsumerBytesMockStrings;
  const someLongHexValue = "0x" + "f".repeat(1984) + "ee42"; // some long value
  const mockPackages: MockDataPackageConfig[] = getRange({
    start: 0,
    length: 3,
  }).map((mockSignerIndex: any) =>
    getMockPackageWithOneBytesDataPoint({
      mockSignerIndex,
      hexValue: someLongHexValue,
    })
  );

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMockStrings"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

    const tx = await wrappedContract.saveLatestValueInStorage(
      DEFAULT_DATA_FEED_ID_BYTES_32
    );
    await tx.wait();

    const latestString = await contract.latestString();
    expect(latestString).to.be.equal(someLongHexValue);
  });

  it("Should revert if values from different signers are different", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData([
      mockPackages[0],
      mockPackages[1],
      getMockPackageWithOneBytesDataPoint({
        mockSignerIndex: 2,
        hexValue: someLongHexValue.replace("ee42", "ff42"),
      }),
    ]);

    await expect(
      wrappedContract.saveLatestValueInStorage(DEFAULT_DATA_FEED_ID_BYTES_32)
    ).to.be.revertedWith(
      "Each authorised signer must provide exactly the same bytes value"
    );
  });

  it("Should revert if there are too few signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData([
      mockPackages[0],
      mockPackages[1],
    ]);

    await expect(
      wrappedContract.saveLatestValueInStorage(DEFAULT_DATA_FEED_ID_BYTES_32)
    ).to.be.revertedWith("Insufficient number of unique signers");
  });

  it("Should revert if there are too few unique signers", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData([
      mockPackages[0],
      mockPackages[1],
      mockPackages[1],
    ]);

    await expect(
      wrappedContract.saveLatestValueInStorage(DEFAULT_DATA_FEED_ID_BYTES_32)
    ).to.be.revertedWith("Insufficient number of unique signers");
  });
});

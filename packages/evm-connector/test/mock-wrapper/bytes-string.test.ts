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
import { UNAUTHORISED_SIGNER_INDEX } from "../tests-common";

describe("SampleRedstoneConsumerBytesMockStrings", function () {
  let contract: SampleRedstoneConsumerBytesMockStrings;
  const someLongHexValue = "0x" + "f".repeat(1984) + "ee42"; // some long value
  const mockBytesPackages: MockDataPackageConfig[] = getRange({
    start: 0,
    length: 3,
  }).map((mockSignerIndex: any) =>
    getMockPackageWithOneBytesDataPoint({
      mockSignerIndex,
      hexValue: someLongHexValue,
    })
  );

  const testShouldPass = async (mockPackages: MockDataPackageConfig[]) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

    const tx = await wrappedContract.saveLatestValueInStorage(
      DEFAULT_DATA_FEED_ID_BYTES_32
    );
    await tx.wait();

    const latestString = await contract.latestString();
    expect(latestString).to.be.equal(someLongHexValue);
  };

  const testShouldRevertWith = async (
    mockPackages: MockDataPackageConfig[],
    revertMsg: string
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

    await expect(
      wrappedContract.saveLatestValueInStorage(DEFAULT_DATA_FEED_ID_BYTES_32)
    ).to.be.revertedWith(revertMsg);
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMockStrings"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract", async () => {
    await testShouldPass(mockBytesPackages);
  });

  it("Should pass even if there are redundant packages", async () => {
    await testShouldPass([...mockBytesPackages, mockBytesPackages[0]]);
  });

  it("Should revert if values from different signers are different", async () => {
    const newPackages = [
      mockBytesPackages[0],
      mockBytesPackages[1],
      getMockPackageWithOneBytesDataPoint({
        mockSignerIndex: 2,
        hexValue: someLongHexValue.replace("ee42", "ff42"),
      }),
    ];
    await testShouldRevertWith(
      newPackages,
      "Each authorised signer must provide exactly the same bytes value"
    );
  });

  it("Should revert if there are too few signers", async () => {
    await testShouldRevertWith(
      [mockBytesPackages[0], mockBytesPackages[1]],
      "Insufficient number of unique signers"
    );
  });

  it("Should revert if there are too few unique signers", async () => {
    await testShouldRevertWith(
      [mockBytesPackages[0], mockBytesPackages[1], mockBytesPackages[1]],
      "Insufficient number of unique signers"
    );
  });

  it("Should revert if there is an unauthorised signer", async () => {
    await testShouldRevertWith(
      [
        ...mockBytesPackages,
        getMockPackageWithOneBytesDataPoint({
          hexValue: someLongHexValue,
          mockSignerIndex: UNAUTHORISED_SIGNER_INDEX,
        }),
      ],
      "Signer is not authorised"
    );
  });
});

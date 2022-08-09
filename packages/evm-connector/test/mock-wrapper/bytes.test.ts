import { expect } from "chai";
import { ethers } from "hardhat";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import {
  DEFAULT_DATA_FEED_ID_BYTES_32,
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockPackageWithOneBytesDataPoint,
  MockPackageWithOneBytesDataPointArgs,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerBytesMock } from "../../typechain-types";
import { UNAUTHORISED_SIGNER_INDEX } from "../tests-common";

describe("SampleRedstoneConsumerBytesMock", function () {
  let contract: SampleRedstoneConsumerBytesMock;

  const mockBytesPackageConfigs: MockPackageWithOneBytesDataPointArgs[] = [
    {
      mockSignerIndex: 0,
      hexValue: "0xf4610900", // hex(41 * 10 ** 8)
    },
    {
      mockSignerIndex: 1,
      hexValue: "0x01004ccb00", // hex(43 * 10 ** 8)
    },
    {
      mockSignerIndex: 2,
      hexValue: "0xfa56ea00", // hex(42 * 10 ** 8)
    },
  ];

  const mockBytesPackages = mockBytesPackageConfigs.map(
    getMockPackageWithOneBytesDataPoint
  );

  const expectedBytesValueConvertedToNumber = 42 * 10 ** 8;

  const testShouldPass = async (mockPackages: MockDataPackageConfig[]) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

    const tx = await wrappedContract.saveOracleValueInContractStorage(
      DEFAULT_DATA_FEED_ID_BYTES_32
    );
    await tx.wait();

    const latestEthPriceFromContract = await contract.latestSavedValue();
    expect(latestEthPriceFromContract.toNumber()).to.be.equal(
      expectedBytesValueConvertedToNumber
    );
  };

  const testShouldRevertWith = async (
    mockPackages: MockDataPackageConfig[],
    revertMsg: string
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);
    await expect(
      wrappedContract.saveOracleValueInContractStorage(
        DEFAULT_DATA_FEED_ID_BYTES_32
      )
    ).to.be.revertedWith(revertMsg);
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract", async () => {
    await testShouldPass(mockBytesPackages);
  });

  it("Should properly execute if there are redundant packages", async () => {
    await testShouldPass([...mockBytesPackages, mockBytesPackages[0]]);
  });

  it("Should properly execute if there are more unique signers than needed", async () => {
    await testShouldPass([
      ...mockBytesPackages,
      getMockPackageWithOneBytesDataPoint({
        ...mockBytesPackageConfigs[0],
        mockSignerIndex: 11, // another authorised signer
      }),
    ]);
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

  it("Should revert for unauthorised signer", async () => {
    const newMockPackages = [
      mockBytesPackages[0],
      mockBytesPackages[1],
      getMockPackageWithOneBytesDataPoint({
        ...mockBytesPackageConfigs[1],
        mockSignerIndex: UNAUTHORISED_SIGNER_INDEX,
      }),
    ];
    await testShouldRevertWith(newMockPackages, "Signer is not authorised");
  });

  it("Should revert for too old timestamp", async () => {
    const newMockPackages = [
      mockBytesPackages[0],
      mockBytesPackages[1],
      getMockPackageWithOneBytesDataPoint({
        ...mockBytesPackageConfigs[2],
        timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
      }),
    ];
    await testShouldRevertWith(newMockPackages, "Timestamp is not valid");
  });

  it("Should revert is data feed id not found", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockBytesPackages);
    await expect(
      wrappedContract.saveOracleValueInContractStorage(
        convertStringToBytes32("ANOTHER_DATA_FEED_ID")
      )
    ).to.be.revertedWith("Insufficient number of unique signers");
  });
});

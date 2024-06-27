import { utils } from "@redstone-finance/protocol";
import { expect } from "chai";
import { ethers } from "hardhat";
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
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockPackages);

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
    revertMsg: string,
    ...args: unknown[]
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockPackages);
    await expect(
      wrappedContract.saveOracleValueInContractStorage(
        DEFAULT_DATA_FEED_ID_BYTES_32
      )
    )
      .to.be.revertedWith(revertMsg)
      .withArgs(...args);
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
      "InsufficientNumberOfUniqueSigners",
      2,
      3
    );
  });

  it("Should revert if there are too few unique signers", async () => {
    await testShouldRevertWith(
      [mockBytesPackages[0], mockBytesPackages[1], mockBytesPackages[1]],
      "InsufficientNumberOfUniqueSigners",
      2,
      3
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
    await testShouldRevertWith(
      newMockPackages,
      "SignerNotAuthorised",
      "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
    );
  });

  it("Should revert for too old timestamp", async () => {
    const newMockPackages = mockBytesPackageConfigs.map((config) =>
      getMockPackageWithOneBytesDataPoint({
        ...config,
        timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
      })
    );
    await testShouldRevertWith(newMockPackages, "TimestampIsNotValid");
  });

  it("Should revert for different timestamps", async () => {
    const newMockPackages = [
      mockBytesPackages[0],
      mockBytesPackages[1],
      getMockPackageWithOneBytesDataPoint({
        ...mockBytesPackageConfigs[2],
        timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
      }),
    ];
    await testShouldRevertWith(newMockPackages, "TimestampsMustBeEqual");
  });

  it("Should revert is data feed id not found", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockBytesPackages);
    await expect(
      wrappedContract.saveOracleValueInContractStorage(
        utils.convertStringToBytes32("ANOTHER_DATA_FEED_ID")
      )
    )
      .to.be.revertedWith("InsufficientNumberOfUniqueSigners")
      .withArgs(0, 3);
  });
});

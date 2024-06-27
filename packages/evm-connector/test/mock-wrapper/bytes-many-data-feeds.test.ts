import { utils } from "@redstone-finance/protocol";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockStringPackage,
} from "../../src/helpers/test-utils";

import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerBytesMockManyDataFeeds } from "../../typechain-types";
import {
  expectedBytesValues,
  mockBytesPackageConfigs,
  mockBytesPackages,
  UNAUTHORISED_SIGNER_INDEX,
} from "../tests-common";

const NUMBER_OF_MOCK_SIGNERS = 3;

describe("SampleRedstoneConsumerBytesMockManyDataFeeds", function () {
  let contract: SampleRedstoneConsumerBytesMockManyDataFeeds;

  const testShouldPass = async (
    mockBytesPackages: MockDataPackageConfig[],
    dataFeedIds: ("ETH" | "BTC")[]
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockBytesPackages);

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32(dataFeedIds[0]),
      utils.convertStringToBytes32(dataFeedIds[1]),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract).to.be.equal(
      expectedBytesValues[dataFeedIds[0]]
    );
    expect(secondValueFromContract).to.be.equal(
      expectedBytesValues[dataFeedIds[1]]
    );
  };

  const testShouldRevertWith = async (
    mockBytesPackages: MockDataPackageConfig[],
    dataFeedIds: string[],
    revertMsg: string,
    ...args: unknown[]
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockBytesPackages);

    await expect(
      wrappedContract.save2ValuesInStorage(
        dataFeedIds.map(utils.convertStringToBytes32)
      )
    )
      .to.be.revertedWith(revertMsg)
      .withArgs(...args);
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerBytesMockManyDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: ETH, BTC)", async () => {
    await testShouldPass(mockBytesPackages, ["ETH", "BTC"]);
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: BTC, ETH)", async () => {
    await testShouldPass(mockBytesPackages, ["BTC", "ETH"]);
  });

  it("Should work properly with the greater number of unique signers than required", async () => {
    const newMockPackages = [
      ...mockBytesPackages,
      getMockStringPackage({
        ...mockBytesPackageConfigs[0],
        mockSignerIndex: 5,
      }),
    ];
    await testShouldPass(newMockPackages, ["BTC", "ETH"]);
  });

  it("Should revert if data feed id not found", async () => {
    await testShouldRevertWith(
      mockBytesPackages,
      ["BTC", "NOT_BTC_AND_NOT_ETH"],
      "InsufficientNumberOfUniqueSigners",
      0,
      3
    );
  });

  it("Should revert for too old timestamp", async () => {
    const newMockPackages = mockBytesPackageConfigs.map((config) =>
      getMockStringPackage({
        ...config,
        timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
      })
    );
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "TimestampIsNotValid"
    );
  });

  it("Should revert for different timestamps", async () => {
    const newMockPackages = [...mockBytesPackages];
    newMockPackages[1] = getMockStringPackage({
      ...mockBytesPackageConfigs[1],
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    });
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "TimestampsMustBeEqual"
    );
  });

  it("Should revert for an unauthorised signer", async () => {
    const newMockPackages = [...mockBytesPackages];
    newMockPackages[1] = getMockStringPackage({
      ...mockBytesPackageConfigs[1],
      mockSignerIndex: UNAUTHORISED_SIGNER_INDEX,
    });
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "SignerNotAuthorised",
      "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
    );
  });

  it("Should revert for insufficient number of signers", async () => {
    const newMockPackages = mockBytesPackages.slice(
      0,
      NUMBER_OF_MOCK_SIGNERS - 1
    );
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "InsufficientNumberOfUniqueSigners",
      2,
      3
    );
  });

  it("Should revert for duplicated packages (not enough unique signers)", async () => {
    const newMockPackages = [...mockBytesPackages];
    newMockPackages[1] = mockBytesPackages[0];
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "InsufficientNumberOfUniqueSigners",
      2,
      3
    );
  });
});

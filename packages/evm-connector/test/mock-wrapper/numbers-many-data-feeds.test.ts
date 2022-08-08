import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockNumericPackage,
} from "../../src/helpers/test-utils";

import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerNumericMockManyDataFeeds } from "../../typechain-types";
import {
  expectedValues,
  mockPackageConfigs,
  mockPackages,
  NUMBER_OF_MOCK_SIGNERS,
} from "../numbers-tests-common";

describe("SampleRedstoneConsumerNumericMockManyDataFeeds", function () {
  let contract: SampleRedstoneConsumerNumericMockManyDataFeeds;

  const testShouldPass = async (
    mockPackages: MockDataPackageConfig[],
    dataFeedIds: ("ETH" | "BTC")[]
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32(dataFeedIds[0]),
      utils.convertStringToBytes32(dataFeedIds[1]),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract.toNumber()).to.be.equal(
      expectedValues[dataFeedIds[0]]
    );
    expect(secondValueFromContract.toNumber()).to.be.equal(
      expectedValues[dataFeedIds[1]]
    );
  };

  const testShouldRevertWith = async (
    mockPackages: MockDataPackageConfig[],
    dataFeedIds: string[],
    revertMsg: string
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);

    await expect(
      wrappedContract.save2ValuesInStorage(
        dataFeedIds.map(utils.convertStringToBytes32)
      )
    ).to.be.revertedWith(revertMsg);
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMockManyDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: ETH, BTC)", async () => {
    await testShouldPass(mockPackages, ["ETH", "BTC"]);
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: BTC, ETH)", async () => {
    await testShouldPass(mockPackages, ["BTC", "ETH"]);
  });

  it("Should work properly with the greater number of unique signers than required", async () => {
    const newMockPackages = [
      ...mockPackages,
      getMockNumericPackage({
        ...mockPackageConfigs[0],
        mockSignerIndex: NUMBER_OF_MOCK_SIGNERS,
      }),
    ];
    await testShouldPass(newMockPackages, ["BTC", "ETH"]);
  });

  it("Should revert if data feed id not found", async () => {
    await testShouldRevertWith(
      mockPackages,
      ["BTC", "ETH2"],
      "Insufficient number of unique signers"
    );
  });

  it("Should revert for too old timestamp", async () => {
    const newMockPackages = [...mockPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockPackageConfigs[1],
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    });
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "Timestamp is not valid"
    );
  });

  it("Should revert for an unauthorised signer", async () => {
    const newMockPackages = [...mockPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockPackageConfigs[1],
      mockSignerIndex: 19, // unauthorised signer index
    });
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "Signer is not authorised"
    );
  });

  it("Should revert for insufficient number of signers", async () => {
    const newMockPackages = mockPackages.slice(0, NUMBER_OF_MOCK_SIGNERS - 1);
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "Insufficient number of unique signers"
    );
  });

  it("Should revert for duplicated packages (not enough unique signers)", async () => {
    const newMockPackages = [...mockPackages];
    newMockPackages[1] = mockPackages[0];
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "Insufficient number of unique signers"
    );
  });
});

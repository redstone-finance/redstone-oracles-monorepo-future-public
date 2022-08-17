import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockNumericPackage,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";
import {
  expectedNumericValues,
  mockNumericPackageConfigs,
  mockNumericPackages,
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
  UNAUTHORISED_SIGNER_INDEX,
} from "../tests-common";

describe("SampleRedstoneConsumerNumericMock", function () {
  let contract: SampleRedstoneConsumerNumericMock;

  const testShouldPass = async (
    mockNumericPackages: MockDataPackageConfig[],
    dataFeedId: "ETH" | "BTC"
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockNumericPackages);

    const tx = await wrappedContract.saveOracleValueInContractStorage(
      utils.convertStringToBytes32(dataFeedId)
    );
    await tx.wait();

    const valueFromContract = await contract.latestSavedValue();

    expect(valueFromContract.toNumber()).to.be.equal(
      expectedNumericValues[dataFeedId]
    );
  };

  const testShouldRevertWith = async (
    mockNumericPackages: MockDataPackageConfig[],
    dataFeedId: string,
    revertMsg: string
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockNumericPackages);

    await expect(
      wrappedContract.saveOracleValueInContractStorage(
        utils.convertStringToBytes32(dataFeedId)
      )
    ).to.be.revertedWith(revertMsg);
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (ETH)", async () => {
    await testShouldPass(mockNumericPackages, "ETH");
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (BTC)", async () => {
    await testShouldPass(mockNumericPackages, "BTC");
  });

  it("Should work properly with the greater number of unique signers than required", async () => {
    const newMockPackages = [
      ...mockNumericPackages,
      getMockNumericPackage({
        ...mockNumericPackageConfigs[0],
        mockSignerIndex: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
      }),
    ];
    await testShouldPass(newMockPackages, "BTC");
  });

  it("Should revert if data feed id not found", async () => {
    await testShouldRevertWith(
      mockNumericPackages,
      "NOT_BTC_AND_NOT_ETH",
      "Insufficient number of unique signers"
    );
  });

  it("Should revert for too old timestamp", async () => {
    const newMockPackages = [...mockNumericPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockNumericPackageConfigs[1],
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    });
    await testShouldRevertWith(
      newMockPackages,
      "BTC",
      "Timestamp is not valid"
    );
  });

  it("Should revert for an unauthorised signer", async () => {
    const newMockPackages = [...mockNumericPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockNumericPackageConfigs[1],
      mockSignerIndex: UNAUTHORISED_SIGNER_INDEX,
    });
    await testShouldRevertWith(
      newMockPackages,
      "BTC",
      "Signer is not authorised"
    );
  });

  it("Should revert for insufficient number of signers", async () => {
    const newMockPackages = mockNumericPackages.slice(
      0,
      NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1
    );
    await testShouldRevertWith(
      newMockPackages,
      "BTC",
      "Insufficient number of unique signers"
    );
  });

  it("Should revert for duplicated packages (not enough unique signers)", async () => {
    const newMockPackages = [...mockNumericPackages];
    newMockPackages[1] = mockNumericPackages[0];
    await testShouldRevertWith(
      newMockPackages,
      "BTC",
      "Insufficient number of unique signers"
    );
  });
});

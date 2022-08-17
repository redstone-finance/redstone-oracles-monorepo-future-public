import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockNumericPackage,
  getRange,
  MockNumericPackageArgs,
} from "../../src/helpers/test-utils";

import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerNumericMockManyDataFeeds } from "../../typechain-types";
import {
  expectedNumericValues,
  mockNumericPackageConfigs,
  mockNumericPackages,
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
  UNAUTHORISED_SIGNER_INDEX,
} from "../tests-common";

describe("SampleRedstoneConsumerNumericMockManyDataFeeds", function () {
  let contract: SampleRedstoneConsumerNumericMockManyDataFeeds;

  const testShouldPass = async (
    mockNumericPackages: MockDataPackageConfig[],
    dataFeedIds: ("ETH" | "BTC")[]
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockNumericPackages);

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32(dataFeedIds[0]),
      utils.convertStringToBytes32(dataFeedIds[1]),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract.toNumber()).to.be.equal(
      expectedNumericValues[dataFeedIds[0]]
    );
    expect(secondValueFromContract.toNumber()).to.be.equal(
      expectedNumericValues[dataFeedIds[1]]
    );
  };

  const testShouldRevertWith = async (
    mockNumericPackages: MockDataPackageConfig[],
    dataFeedIds: string[],
    revertMsg: string
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockNumericPackages);

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
    await testShouldPass(mockNumericPackages, ["ETH", "BTC"]);
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: BTC, ETH)", async () => {
    await testShouldPass(mockNumericPackages, ["BTC", "ETH"]);
  });

  it("Should properly execute transaction with 20 single pacakages (10 for ETH and 10 for BTC)", async () => {
    const mockSinglePackageConfigs: MockNumericPackageArgs[] = [
      ...getRange({ start: 0, length: NUMBER_OF_MOCK_NUMERIC_SIGNERS }).map(
        (mockSignerIndex: any) => ({
          mockSignerIndex,
          dataPoints: [
            { dataFeedId: "BTC", value: 400 },
            { dataFeedId: "SOME OTHER ID", value: 123 },
          ],
        })
      ),
      ...getRange({ start: 0, length: NUMBER_OF_MOCK_NUMERIC_SIGNERS }).map(
        (mockSignerIndex: any) => ({
          mockSignerIndex,
          dataPoints: [
            { dataFeedId: "ETH", value: 42 },
            { dataFeedId: "SOME OTHER ID", value: 345 },
          ],
        })
      ),
    ];
    const mockSinglePackages = mockSinglePackageConfigs.map(
      getMockNumericPackage
    );
    await testShouldPass(mockSinglePackages, ["BTC", "ETH"]);
  });

  it("Should work properly with the greater number of unique signers than required", async () => {
    const newMockPackages = [
      ...mockNumericPackages,
      getMockNumericPackage({
        ...mockNumericPackageConfigs[0],
        mockSignerIndex: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
      }),
    ];
    await testShouldPass(newMockPackages, ["BTC", "ETH"]);
  });

  it("Should revert if data feed id not found", async () => {
    await testShouldRevertWith(
      mockNumericPackages,
      ["BTC", "NOT_BTC_AND_NOT_ETH"],
      "Insufficient number of unique signers"
    );
  });

  it("Should revert for enough data packages but insufficient number of one data feed id", async () => {
    const newMockPackages = [...mockNumericPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockNumericPackageConfigs[1],
      dataPoints: [mockNumericPackageConfigs[1].dataPoints[0]],
    });
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
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
      ["BTC", "ETH"],
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
      ["BTC", "ETH"],
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
      ["BTC", "ETH"],
      "Insufficient number of unique signers"
    );
  });

  it("Should revert for duplicated packages (not enough unique signers)", async () => {
    const newMockPackages = [...mockNumericPackages];
    newMockPackages[1] = mockNumericPackages[0];
    await testShouldRevertWith(
      newMockPackages,
      ["BTC", "ETH"],
      "Insufficient number of unique signers"
    );
  });
});

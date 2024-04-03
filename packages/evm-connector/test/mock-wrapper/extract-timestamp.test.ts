import { expect } from "chai";
import { ethers } from "hardhat";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockNumericPackage,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";
import { mockNumericPackages } from "../tests-common";

const getSimpleTestPackageWithTimestamp = (timestamp: number) =>
  getMockNumericPackage({
    mockSignerIndex: 0,
    timestampMilliseconds: timestamp,
    dataPoints: [{ dataFeedId: "BTC", value: 123 }],
  });

describe("Extract Timestamp", function () {
  let sampleContract: SampleRedstoneConsumerNumericMock;

  beforeEach(async () => {
    const SampleRedstoneConsumerNumericMock = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMock"
    );
    sampleContract = await SampleRedstoneConsumerNumericMock.deploy();
  });

  it("Should extract timestamp correctly", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(sampleContract).usingMockDataPackages(
        mockNumericPackages
      );

    const timestamp =
      await wrappedContract.extractTimestampFromRedstonePayload();

    expect(timestamp).to.be.equal(DEFAULT_TIMESTAMP_FOR_TESTS);
  });

  it("Should revert if 2 timestamps are not equal", async () => {
    const wrappedContract = WrapperBuilder.wrap(
      sampleContract
    ).usingMockDataPackages([
      getSimpleTestPackageWithTimestamp(DEFAULT_TIMESTAMP_FOR_TESTS),
      getSimpleTestPackageWithTimestamp(DEFAULT_TIMESTAMP_FOR_TESTS + 1),
    ]);

    await expect(
      wrappedContract.extractTimestampFromRedstonePayload()
    ).to.be.revertedWith("DataPackageTimestampsMustBeEqual");
  });

  it("Should revert if one of many timestamps is different", async () => {
    const wrappedContract = WrapperBuilder.wrap(
      sampleContract
    ).usingMockDataPackages([
      getSimpleTestPackageWithTimestamp(DEFAULT_TIMESTAMP_FOR_TESTS),
      getSimpleTestPackageWithTimestamp(DEFAULT_TIMESTAMP_FOR_TESTS),
      getSimpleTestPackageWithTimestamp(DEFAULT_TIMESTAMP_FOR_TESTS),
      getSimpleTestPackageWithTimestamp(DEFAULT_TIMESTAMP_FOR_TESTS + 1),
      getSimpleTestPackageWithTimestamp(DEFAULT_TIMESTAMP_FOR_TESTS),
    ]);

    await expect(
      wrappedContract.extractTimestampFromRedstonePayload()
    ).to.be.revertedWith("DataPackageTimestampsMustBeEqual");
  });
});

import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleProxyConnector } from "../../typechain-types";
import { WrapperBuilder } from "../../src";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import {
  expectedNumericValues,
  mockNumericPackages,
  mockNumericPackageConfigs,
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
  UNAUTHORISED_SIGNER_INDEX,
} from "../tests-common";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import {
  DEFAULT_TIMESTAMP_FOR_TESTS,
  getMockNumericPackage,
  getRange,
  MockSignerIndex,
} from "../../src/helpers/test-utils";

describe("SampleProxyConnector", function () {
  let contract: SampleProxyConnector;
  const ethDataFeedId = convertStringToBytes32("ETH");

  const testShouldRevertWith = async (
    mockPackages: MockDataPackageConfig[],
    revertMsg: string
  ) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockPackages);
    await expect(
      wrappedContract.getOracleValueUsingProxy(ethDataFeedId)
    ).to.be.revertedWith(revertMsg);
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleProxyConnector"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should return correct oracle value for one asset", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockNumericPackages);

    const fetchedValue = await wrappedContract.getOracleValueUsingProxy(
      ethDataFeedId
    );
    expect(fetchedValue).to.eq(expectedNumericValues.ETH);
  });

  it("Should return correct oracle values for 10 assets", async () => {
    const dataPoints = [
      { dataFeedId: "ETH", value: 4000 },
      { dataFeedId: "AVAX", value: 5 },
      { dataFeedId: "BTC", value: 100000 },
      { dataFeedId: "LINK", value: 2 },
      { dataFeedId: "UNI", value: 200 },
      { dataFeedId: "FRAX", value: 1 },
      { dataFeedId: "OMG", value: 0.00003 },
      { dataFeedId: "DOGE", value: 2 },
      { dataFeedId: "SOL", value: 11 },
      { dataFeedId: "BNB", value: 31 },
    ];

    const mockNumericPackages = getRange({
      start: 0,
      length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
    }).map((i) =>
      getMockNumericPackage({
        dataPoints,
        mockSignerIndex: i as MockSignerIndex,
      })
    );

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockNumericPackages);

    for (const dataPoint of dataPoints) {
      await expect(
        wrappedContract.checkOracleValue(
          convertStringToBytes32(dataPoint.dataFeedId),
          Math.round(dataPoint.value * 10 ** 8)
        )
      ).not.to.be.reverted;
    }
  });

  it("Should forward msg.value", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockNumericPackages);
    await expect(
      wrappedContract.requireValueForward({
        value: ethers.utils.parseUnits("2137"),
      })
    ).not.to.be.reverted;
  });

  it("Should work properly with long encoded functions", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockNumericPackages);
    await expect(
      wrappedContract.checkOracleValueLongEncodedFunction(
        ethDataFeedId,
        expectedNumericValues.ETH
      )
    ).not.to.be.reverted;
    await expect(
      wrappedContract.checkOracleValueLongEncodedFunction(ethDataFeedId, 9999)
    ).to.be.revertedWith("Wrong value!");
  });

  it("Should fail with correct message (timestamp invalid)", async () => {
    const newMockPackages = [...mockNumericPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockNumericPackageConfigs[1],
      timestampMilliseconds: DEFAULT_TIMESTAMP_FOR_TESTS - 1,
    });
    await testShouldRevertWith(newMockPackages, "Timestamp is not valid");
  });

  it("Should fail with correct message (insufficient number of unique signers)", async () => {
    const newMockPackages = mockNumericPackages.slice(
      0,
      NUMBER_OF_MOCK_NUMERIC_SIGNERS - 1
    );
    await testShouldRevertWith(
      newMockPackages,
      "Insufficient number of unique signers"
    );
  });

  it("Should fail with correct message (signer is not authorised)", async () => {
    const newMockPackages = [...mockNumericPackages];
    newMockPackages[1] = getMockNumericPackage({
      ...mockNumericPackageConfigs[1],
      mockSignerIndex: UNAUTHORISED_SIGNER_INDEX,
    });
    await testShouldRevertWith(newMockPackages, "Signer is not authorised");
  });
});

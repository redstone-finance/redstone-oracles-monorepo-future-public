import { utils } from "@redstone-finance/protocol";
import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src";
import {
  MockSignerIndex,
  getMockNumericPackage,
  getRange,
} from "../../src/helpers/test-utils";
import {
  SampleStorageProxy,
  SampleStorageProxyConsumer,
} from "../../typechain-types";
import {
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
  expectedNumericValues,
  mockNumericPackages,
} from "../tests-common";

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

const dataFeedIdsBytes = dataPoints.map((dataPoint) => {
  return utils.convertStringToBytes32(dataPoint.dataFeedId);
});

const prepareMockPackagesForManyAssets = () => {
  const mockNumericPackages = getRange({
    start: 0,
    length: NUMBER_OF_MOCK_NUMERIC_SIGNERS,
  }).map((i) =>
    getMockNumericPackage({
      dataPoints,
      mockSignerIndex: i as MockSignerIndex,
    })
  );

  return mockNumericPackages;
};

describe("SampleStorageProxy", function () {
  let contract: SampleStorageProxy;
  let consumerContract: SampleStorageProxyConsumer;
  const ethDataFeedId = utils.convertStringToBytes32("ETH");

  this.beforeEach(async () => {
    const SampleStorageFactory =
      await ethers.getContractFactory("SampleStorageProxy");
    contract = await SampleStorageFactory.deploy();
    await contract.deployed();

    const SampleStorageProxyConsumer = await ethers.getContractFactory(
      "SampleStorageProxyConsumer"
    );

    consumerContract = await SampleStorageProxyConsumer.deploy(
      contract.address
    );
    await consumerContract.deployed();

    await contract.register(consumerContract.address);
  });

  it("Should return correct oracle value for one asset using dry run", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const fetchedValue =
      await wrappedContract.fetchValueUsingProxyDryRun(ethDataFeedId);

    expect(fetchedValue).to.eq(expectedNumericValues.ETH);
  });

  it("Should return correct structure containing oracle value using dry run", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const fetchedValue =
      await wrappedContract.fetchStructUsingProxyDryRun(ethDataFeedId);

    const expectedValue = [
      "sample",
      ethers.BigNumber.from(expectedNumericValues.ETH),
    ];

    expect(fetchedValue).to.deep.equal(expectedValue);
  });

  it("Should return correct oracle values for array of values using dry run", async () => {
    const mockNumericPackages = prepareMockPackagesForManyAssets();

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const dataValues = dataPoints.map((dataPoint) =>
      ethers.BigNumber.from(dataPoint.value * 10 ** 8)
    );

    const fetchedValues =
      await wrappedContract.fetchValuesUsingProxyDryRun(dataFeedIdsBytes);

    expect(dataValues).to.deep.eq(fetchedValues);
  });

  it("Should return correct array of structures containing oracle values using dry run", async () => {
    const mockNumericPackages = prepareMockPackagesForManyAssets();

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const fetchedValues =
      await wrappedContract.fetchArrayOfStructsUsingProxyDryRun(
        dataFeedIdsBytes
      );

    const dataValues = dataPoints.map((dataPoint) => [
      "sample",
      ethers.BigNumber.from(dataPoint.value * 10 ** 8),
    ]);

    expect(dataValues).to.deep.eq(fetchedValues);
  });

  it("Should return correct structure of arrays containing oracle values using dry run", async () => {
    const mockNumericPackages = prepareMockPackagesForManyAssets();

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const fetchedValues =
      await wrappedContract.fetchStructOfArraysUsingProxyDryRun(
        dataFeedIdsBytes
      );

    const names = dataPoints.map((_dataPoint) => "sample");
    const values = dataPoints.map((dataPoint) =>
      ethers.BigNumber.from(dataPoint.value * 10 ** 8)
    );

    const dataValuesArray = [names, values];

    expect(dataValuesArray).to.deep.eq(fetchedValues);
  });

  it("Should return correct oracle value for one asset", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    await wrappedContract.saveOracleValueInContractStorage(ethDataFeedId);

    const fetchedValue = await consumerContract.getOracleValue(ethDataFeedId);
    expect(fetchedValue).to.eq(expectedNumericValues.ETH);
  });

  it("Should return correct oracle values for 10 assets", async () => {
    const mockNumericPackages = prepareMockPackagesForManyAssets();

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    for (const dataPoint of dataPoints) {
      await wrappedContract.saveOracleValueInContractStorage(
        utils.convertStringToBytes32(dataPoint.dataFeedId)
      );
      await expect(
        consumerContract.checkOracleValue(
          utils.convertStringToBytes32(dataPoint.dataFeedId),
          Math.round(dataPoint.value * 10 ** 8)
        )
      ).not.to.be.reverted;
    }
  });

  it("Should return correct oracle values for 10 assets simultaneously", async () => {
    const mockNumericPackages = prepareMockPackagesForManyAssets();

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const dataValues = dataPoints.map((dataPoint) =>
      Math.round(dataPoint.value * 10 ** 8)
    );

    await wrappedContract.saveOracleValuesInContractStorage(dataFeedIdsBytes);
    await expect(
      consumerContract.checkOracleValues(dataFeedIdsBytes, dataValues)
    ).not.to.be.reverted;
  });
});

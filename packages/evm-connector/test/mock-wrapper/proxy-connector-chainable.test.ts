import { ethers } from "hardhat";
import { expect } from "chai";
import {
  SampleChainableProxyConnector,
  SampleProxyConnectorConsumer,
} from "../../typechain-types";
import { WrapperBuilder } from "../../src";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import {
  expectedNumericValues,
  mockNumericPackages,
  NUMBER_OF_MOCK_NUMERIC_SIGNERS,
} from "../tests-common";
import {
  getMockNumericPackage,
  getRange,
  MockSignerIndex,
} from "../../src/helpers/test-utils";

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

describe("SampleChainableProxyConnector", function () {
  let contract: SampleChainableProxyConnector;
  let consumerContract: SampleProxyConnectorConsumer;
  const ethDataFeedId = convertStringToBytes32("ETH");

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleChainableProxyConnector"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();

    const contractB = await ContractFactory.deploy();
    await contractB.deployed();

    await contract.registerNextConnector(contractB.address);

    const ConsumerContractFactory = await ethers.getContractFactory(
      "SampleProxyConnectorConsumer"
    );
    consumerContract = await ConsumerContractFactory.deploy();
    await consumerContract.deployed();

    await contractB.registerConsumer(consumerContract.address);
  });

  it("Should process oracle value for one asset", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    await wrappedContract.processOracleValue(ethDataFeedId);

    const fetchedValue = await consumerContract.getComputationResult();
    expect(fetchedValue).to.eq(expectedNumericValues.ETH * 42);
  });

  it("Should process oracle values for 10 assets", async () => {
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
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const dataValues = dataPoints.map((dataPoint) =>
      Math.round(dataPoint.value * 10 ** 8)
    );

    for (const dataPoint of dataPoints) {
      await wrappedContract.processOracleValue(
        convertStringToBytes32(dataPoint.dataFeedId)
      );
    }

    const computationResult = await consumerContract.getComputationResult();

    expect(computationResult).to.eq(dataValues.reduce((a, b) => a + b, 0) * 42);
  });

  it("Should process oracle values for 10 assets simultaneously", async () => {
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
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const dataFeedIds = dataPoints.map((dataPoint) => dataPoint.dataFeedId);
    const dataFeedIdsBytes = dataFeedIds.map(convertStringToBytes32);
    const dataValues = dataPoints.map((dataPoint) =>
      Math.round(dataPoint.value * 10 ** 8)
    );

    await wrappedContract.processOracleValues(dataFeedIdsBytes);
    const computationResult = await consumerContract.getComputationResult();

    expect(computationResult).to.eq(dataValues.reduce((a, b) => a + b, 0) * 42);
  });
});

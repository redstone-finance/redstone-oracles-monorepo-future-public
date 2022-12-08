import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerNumericMockManyDataFeeds } from "../../typechain-types";
import { expectedNumericValues } from "../tests-common";
import { server } from "./mock-server";

chai.use(chaiAsPromised);

describe("DataServiceWrapper", () => {
  let contract: SampleRedstoneConsumerNumericMockManyDataFeeds;

  const runTest = async (urls: string[]) => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService(
      {
        dataServiceId: "mock-data-service",
        uniqueSignersCount: 1,
        dataFeeds: ["ETH", "BTC"],
      },
      urls
    );

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("ETH"),
      utils.convertStringToBytes32("BTC"),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract.toNumber()).to.be.equal(
      expectedNumericValues["ETH"]
    );
    expect(secondValueFromContract.toNumber()).to.be.equal(
      expectedNumericValues["BTC"]
    );
  };

  before(() => server.listen());
  beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMockManyDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it("Should properly execute with one valid cache", async () => {
    await runTest(["http://valid-cache.com"]);
  });

  it("Should properly execute with one valid and one invalid cache", async () => {
    await runTest(["http://valid-cache.com", "http://invalid-cache.com"]);
  });

  it("Should properly execute with one valid and one slower cache", async () => {
    await runTest(["http://slower-cache.com", "http://valid-cache.com"]);
  });

  it("Should properly execute with one invalid and one slower cache", async () => {
    await runTest(["http://invalid-cache.com", "http://slower-cache.com"]);
  });

  it("Should throw error when multiple invalid caches", async () => {
    const expectedErrorMessage = `All redstone payloads do not pass dry run verification, aggregated errors: [
  {
    "reason": null,
    "code": "CALL_EXCEPTION",
    "method": "save2ValuesInStorage(bytes32[])",
    "data": "0xec459bc000000000000000000000000041e13e6e0a8b13f8539b71f3c07d3f97f887f573",
    "errorArgs": [
      "0x41e13E6e0A8B13F8539B71f3c07d3f97F887F573"
    ],
    "errorName": "SignerNotAuthorised",
    "errorSignature": "SignerNotAuthorised(address)"
  },
  {
    "reason": null,
    "code": "CALL_EXCEPTION",
    "method": "save2ValuesInStorage(bytes32[])",
    "data": "0xec459bc000000000000000000000000041e13e6e0a8b13f8539b71f3c07d3f97f887f573",
    "errorArgs": [
      "0x41e13E6e0A8B13F8539B71f3c07d3f97F887F573"
    ],
    "errorName": "SignerNotAuthorised",
    "errorSignature": "SignerNotAuthorised(address)"
  }
]`;
    await expect(
      runTest(["http://invalid-cache.com", "http://invalid-cache.com"])
    ).to.be.rejectedWith(expectedErrorMessage);
  });
});

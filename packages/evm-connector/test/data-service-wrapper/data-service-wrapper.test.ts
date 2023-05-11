import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerNumericMockManyDataFeeds } from "../../typechain-types";
import { expectedNumericValues } from "../tests-common";
import { server } from "./mock-server";

chai.use(chaiAsPromised);

const runTest = async (
  contract: Contract,
  urls?: string[],
  dataServiceId?: string,
  uniqueSignersCount?: number
) => {
  const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
    dataServiceId,
    uniqueSignersCount,
    dataFeeds: ["ETH", "BTC"],
    urls,
  });

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

describe.only("DataServiceWrapper", () => {
  before(() => server.listen());
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  describe("With passed 'dataServiceId'", () => {
    let contract: SampleRedstoneConsumerNumericMockManyDataFeeds;

    beforeEach(async () => {
      const ContractFactory = await ethers.getContractFactory(
        "SampleRedstoneConsumerNumericMockManyDataFeeds"
      );
      contract = await ContractFactory.deploy();
      await contract.deployed();
    });

    it("Should properly execute with one valid cache", async () => {
      await runTest(contract, ["http://valid-cache.com"], "mock-data-service");
    });

    it("Should properly execute with one valid and one invalid cache", async () => {
      await runTest(
        contract,
        ["http://valid-cache.com", "http://invalid-cache.com"],
        "mock-data-service"
      );
    });

    it("Should properly execute with one valid and one slower cache", async () => {
      await runTest(
        contract,
        ["http://slower-cache.com", "http://valid-cache.com"],
        "mock-data-service"
      );
    });

    it("Should properly execute with one invalid and one slower cache", async () => {
      await runTest(
        contract,
        ["http://invalid-cache.com", "http://slower-cache.com"],
        "mock-data-service"
      );
    });

    it("Should get urls from redstone-protocol if not provided", async () => {
      await runTest(contract, undefined, "mock-data-service");
    });

    it("Should fail if contract doesn't expose getDataServiceId and dataServiceId is not passed", async () => {
      await expect(runTest(contract, undefined, undefined)).rejectedWith();
    });

    it("Should throw error when multiple invalid caches", async () => {
      const expectedErrorMessage = `All redstone payloads do not pass dry run verification, aggregated errors: {
  "reason": null,
  "code": "CALL_EXCEPTION",
  "method": "save2ValuesInStorage(bytes32[])",
  "data": "0xec459bc000000000000000000000000041e13e6e0a8b13f8539b71f3c07d3f97f887f573",
  "errorArgs": [
    "0x41e13E6e0A8B13F8539B71f3c07d3f97F887F573"
  ],
  "errorName": "SignerNotAuthorised",
  "errorSignature": "SignerNotAuthorised(address)"
},{
  "reason": null,
  "code": "CALL_EXCEPTION",
  "method": "save2ValuesInStorage(bytes32[])",
  "data": "0xec459bc000000000000000000000000041e13e6e0a8b13f8539b71f3c07d3f97f887f573",
  "errorArgs": [
    "0x41e13E6e0A8B13F8539B71f3c07d3f97F887F573"
  ],
  "errorName": "SignerNotAuthorised",
  "errorSignature": "SignerNotAuthorised(address)"
}`;
      await expect(
        runTest(
          contract,
          ["http://invalid-cache.com", "http://invalid-cache.com"],
          "mock-data-service"
        )
      ).to.be.rejectedWith(expectedErrorMessage);
    });
  });

  describe("With RedstoneDataServiceConsumer contract", () => {
    let contract: Contract;

    beforeEach(async () => {
      const ContractFactory = await ethers.getContractFactory(
        "SampleRedstoneDataServiceConsumerMock"
      );
      contract = await ContractFactory.deploy();
      await contract.deployed();
    });

    it("Should work with passed urls", async () => {
      await runTest(contract, ["http://valid-cache.com"]);
    });

    it("Should work with out passed urls", async () => {
      await runTest(contract);
    });

    it("Should throw on not supported data-service id", async () => {
      await expect(
        runTest(contract, undefined, "wrong-service-id")
      ).rejectedWith(
        "Data service wrong-service-id is not configured by Redstone protocol"
      );
    });

    it("Should work with dataServiceId passed explicit", async () => {
      await runTest(contract, undefined, "mock-data-service");
    });

    it("Should work with dataServiceId  and urls passed explicit", async () => {
      await runTest(contract, ["http://valid-cache.com"], "mock-data-service");
    });
  });
});

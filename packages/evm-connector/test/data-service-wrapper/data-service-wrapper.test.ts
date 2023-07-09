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

describe("DataServiceWrapper", () => {
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
      await runTest(
        contract,
        ["http://valid-cache.com"],
        "mock-data-service-tests"
      );
    });

    it("Should properly execute with one valid and one invalid cache", async () => {
      await runTest(
        contract,
        ["http://valid-cache.com", "http://invalid-cache.com"],
        "mock-data-service-tests"
      );
    });

    it("Should properly execute with one valid and one slower cache", async () => {
      await runTest(
        contract,
        ["http://slower-cache.com", "http://valid-cache.com"],
        "mock-data-service-tests"
      );
    });

    it("Should get urls from redstone-protocol if not provided", async () => {
      await runTest(contract, undefined, "mock-data-service-tests");
    });

    it("Should fail if contract doesn't expose getDataServiceId and dataServiceId is not passed", async () => {
      await expect(runTest(contract, undefined, undefined)).rejectedWith();
    });

    it("Should throw error when multiple invalid caches", async () => {
      const expectedErrorMessage = `VM Exception while processing transaction: reverted with custom error 'SignerNotAuthorised("0x41e13E6e0A8B13F8539B71f3c07d3f97F887F573")`;
      await expect(
        runTest(
          contract,
          ["http://invalid-cache.com", "http://invalid-cache.com"],
          "mock-data-service-tests"
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
      await runTest(contract, undefined, "mock-data-service-tests");
    });

    it("Should work with dataServiceId  and urls passed explicit", async () => {
      await runTest(
        contract,
        ["http://valid-cache.com"],
        "mock-data-service-tests"
      );
    });
  });
});

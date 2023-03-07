import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerNumericMockManyDataFeeds } from "../../typechain-types";
import { expectedNumericValues } from "../tests-common";
import { getValidDataPackagesResponse } from "./helpers";

chai.use(chaiAsPromised);

describe("DataPackagesWrapper", () => {
  let contract: SampleRedstoneConsumerNumericMockManyDataFeeds;

  const runTest = async (dataPackagesResponse: DataPackagesResponse) => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingDataPackages(dataPackagesResponse);

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

  beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMockManyDataFeeds"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute", async () => {
    const dataPackagesResponse = getValidDataPackagesResponse();
    await runTest(dataPackagesResponse);
  });
});

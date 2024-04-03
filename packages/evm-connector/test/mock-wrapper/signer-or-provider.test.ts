import { utils } from "@redstone-finance/protocol";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src/index";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";
import { mockNumericPackages } from "../tests-common";

chai.use(chaiAsPromised);

const DATA_FEED_ID = utils.convertStringToBytes32("ETH");
const EXPECTED_DATA_FEED_VALUE = 4200000000;

describe("SignerOrProviderTest", function () {
  let deployedContract: SampleRedstoneConsumerNumericMock;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMock"
    );
    deployedContract = await ContractFactory.deploy();
    await deployedContract.deployed();
  });

  it("Should call static function without signer", async () => {
    const contract = deployedContract.connect(ethers.provider);

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    const response = await wrappedContract.getValueForDataFeedId(DATA_FEED_ID);
    expect(response.toNumber()).to.equal(EXPECTED_DATA_FEED_VALUE);
  });

  it("Should revert with non-static function without signer", async () => {
    const contract = deployedContract.connect(ethers.provider);

    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    await expect(
      wrappedContract.saveOracleValueInContractStorage(DATA_FEED_ID)
    ).to.be.rejectedWith(
      "Cannot read properties of null (reading 'sendTransaction')"
    );
  });

  it("Should call non-static function with signer", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(deployedContract).usingMockDataPackages(
        mockNumericPackages
      );

    const tx =
      await wrappedContract.saveOracleValueInContractStorage(DATA_FEED_ID);
    await tx.wait();
  });
});

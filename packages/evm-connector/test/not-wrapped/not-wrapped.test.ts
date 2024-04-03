import { utils } from "@redstone-finance/protocol";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SampleRedstoneConsumerNumericMock } from "../../typechain-types";

describe("Not Wrapped Contract", function () {
  let contract: SampleRedstoneConsumerNumericMock;

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should revert if contract was not wrapped", async () => {
    await expect(
      contract.saveOracleValueInContractStorage(
        utils.convertStringToBytes32("BTC")
      )
    )
      .to.be.revertedWith("CalldataMustHaveValidPayload")
      .withArgs();
  });
});

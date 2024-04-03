import { consts, utils } from "@redstone-finance/protocol";
import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src/index";
import { mockNumericPackages } from "../tests-common";

describe("PopulateTransactionTest", function () {
  it("Should overwrite populateTransaction", async () => {
    // Deploying the contract
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerNumericMock"
    );
    const contract = await ContractFactory.deploy();
    await contract.deployed();

    // Wrapping the contract
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockDataPackages(mockNumericPackages);

    // Prepare calldata for original and wrapped contracts
    const dataFeedId = utils.convertStringToBytes32("ETH");
    const originalTxPopulated =
      await contract.populateTransaction["getValueForDataFeedId"](dataFeedId);
    const wrappedTxPopulated =
      await wrappedContract.populateTransaction["getValueForDataFeedId"](
        dataFeedId
      );

    // Checking the calldata
    const redstoneMarker = consts.REDSTONE_MARKER_HEX.replace("0x", "");
    expect(originalTxPopulated.data)
      .to.be.a("string")
      .and.satisfy((str: string) => !str.endsWith(redstoneMarker));
    expect(wrappedTxPopulated.data)
      .to.be.a("string")
      .and.satisfy((str: string) => str.endsWith(redstoneMarker));
  });
});

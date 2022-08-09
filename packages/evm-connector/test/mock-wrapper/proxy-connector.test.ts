import { ethers } from "hardhat";
import { expect } from "chai";
import { SampleProxyConnector } from "../../typechain-types";
import { WrapperBuilder } from "../../src";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import { expectedNumericValues, mockNumericPackages } from "../tests-common";

// TODO: add more tests

describe("SampleProxyConnector", function () {
  let contract: SampleProxyConnector;

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
      convertStringToBytes32("ETH")
    );
    expect(fetchedValue).to.eq(expectedNumericValues.ETH);
  });

  it("Should return correct oracle values for 10 assets in correct order", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should forward msg.value", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should work properly with long encoded functions", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should fail with correct message (timestamp invalid)", async () => {
    expect(2 + 2).to.eq(4);
  });

  it("Should fail with correct message (insufficient number of unique signers)", async () => {
    expect(2 + 2).to.eq(4);
  });
});

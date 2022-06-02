import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../src/index";
import { SamplePriceAwareMock } from "../typechain-types";

describe("SamplePriceAwareMock", function () {
  it("Should properly pass data to a contract", async function () {
    const ContractFactory = await ethers.getContractFactory(
      "SamplePriceAwareMock"
    );
    const contract: SamplePriceAwareMock = await ContractFactory.deploy();
    await contract.deployed();

    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData({
      timestampMilliseconds: Date.now(),
      dataPoints: [{ symbol: "ETH", value: 42 }],
    });

    const result = await wrappedContract.getEthPriceSecurely();
    expect(result.div(10 ** 8).toNumber()).to.be.equal(42);
  });
});

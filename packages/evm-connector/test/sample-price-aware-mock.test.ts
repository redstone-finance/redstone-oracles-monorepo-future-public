import { expect } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../src/index";
import { SamplePriceAwareMock } from "../typechain-types";

describe("SamplePriceAwareMock", function () {
  let contract: SamplePriceAwareMock;

  it("Should properly deploy contract", async function () {
    const ContractFactory = await ethers.getContractFactory(
      "SamplePriceAwareMock"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly read oracle data using contract view function", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData({
      timestampMilliseconds: Date.now(),
      dataPoints: [{ symbol: "ETH", value: 42 }],
    });

    const result = await wrappedContract.getEthPriceSecurely();
    expect(result.div(10 ** 8).toNumber()).to.be.equal(42);
  });

  it("Should properly execute transaction on PriceAware contract", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingMockData({
      timestampMilliseconds: Date.now(),
      dataPoints: [{ symbol: "ETH", value: 43 }],
    });

    const tx = await wrappedContract.saveLatestEthPriceInStorage();
    await tx.wait();

    const latestEthPriceFromContract = await contract.latestEthPrice();
    expect(latestEthPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(43);
  });
});
